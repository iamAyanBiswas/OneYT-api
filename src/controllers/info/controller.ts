
import { YtDlp } from "ytdlp-nodejs";
import { createToken } from "../../lib/token";
import { getSafeVideoURL } from "../../lib/utils";
import { FastifyReply, FastifyRequest } from "fastify";


interface Querystring {
    id: string;
    downloadType: 'audio' | 'video'
}
function formatFilesize(bytes: number | null | undefined): string {
    if (!bytes || bytes === 0) return 'Unknown';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
}

// Calculate filesize from bitrate and duration when not directly available
function calculateFilesize(format: any, duration: number): number {
    // If we have direct filesize data, use it
    if (format.filesize) return format.filesize;
    if (format.filesize_approx) return format.filesize_approx;

    // Otherwise, estimate from bitrate
    // Priority: tbr (total bitrate) > vbr (video bitrate) + abr (audio bitrate) > vbr alone
    let bitrate = 0;

    if (format.tbr) {
        bitrate = format.tbr;
    } else if (format.vbr && format.abr) {
        bitrate = format.vbr + format.abr;
    } else if (format.vbr) {
        bitrate = format.vbr;
    } else if (format.abr) {
        bitrate = format.abr;
    }

    // Calculate: bitrate (kbps) * duration (seconds) * 1024 / 8 = bytes
    if (bitrate > 0 && duration > 0) {
        return Math.floor((bitrate * duration * 1024) / 8);
    }

    return 0;
}



export async function infoController(req: FastifyRequest<{ Querystring: Querystring }>, res: FastifyReply) {
    const ip = req.ip
    const { id, downloadType } = req.query

    if (!id) {
        return res.status(400).send({ error: 'ID is required' });
    }
    if (downloadType !== 'video' && downloadType !== 'audio') {
        return res.status(400).send({ error: 'downloadType is required' });
    }

    const ytdlp = new YtDlp();

    try {

        const start = performance.now();

        const info = await ytdlp.getInfoAsync(getSafeVideoURL(id));

        const end = performance.now();

        // Check if it's a playlist - we only support single videos
        if ('entries' in info) {
            return res.status(0).send({
                error: 'Playlists are not supported. Please provide a single video URL.'
            });
        }

        // Extract basic video info
        const title = info.title || 'Unknown';
        const duration = info.duration || 0;
        const thumbnail = info.thumbnail || '';
        const uploader = info.uploader || 'Unknown';

        // Process video formats - filter for video+audio or video-only formats
        const videoFormats: VideoFormat[] = [];

        // Process audio formats
        const audioFormats: AudioFormat[] = [];


        if (downloadType === 'video') {
            const processedResolutions = new Set<string>();

            if (info.formats && Array.isArray(info.formats)) {
                // Group formats by resolution
                const formatsByResolution = new Map<string, any[]>();

                info.formats.forEach((format: any) => {
                    if (format.vcodec && format.vcodec !== 'none') {
                        const resolution = format.resolution || `${format.width}x${format.height}`;
                        if (!formatsByResolution.has(resolution)) {
                            formatsByResolution.set(resolution, []);
                        }
                        formatsByResolution.get(resolution)!.push(format);
                    }
                });

                // For each resolution, pick the best format (preferably with audio, or largest filesize)
                formatsByResolution.forEach((formats, resolution) => {
                    // Prefer formats with both video and audio
                    const withAudio = formats.filter(f => f.acodec && f.acodec !== 'none');
                    const bestFormat = withAudio.length > 0
                        ? withAudio.sort((a, b) => (b.filesize || 0) - (a.filesize || 0))[0]
                        : formats.sort((a, b) => (b.filesize || 0) - (a.filesize || 0))[0];

                    if (bestFormat && !processedResolutions.has(resolution)) {
                        const height = bestFormat.height || 0;
                        let qualityLabel: string = ''

                        if (height >= 240) {
                            // Standardize quality labels
                            if (height >= 2160) qualityLabel = '4K';
                            else if (height >= 1440) qualityLabel = '2K';
                            else if (height >= 1080) qualityLabel = 'FHD';
                            else if (height >= 720) qualityLabel = 'HD';
                            else if (height >= 480) qualityLabel = '';
                            else if (height >= 360) qualityLabel = '';
                            else if (height >= 240) qualityLabel = '';
                            else if (height >= 144) qualityLabel = '';

                            const filesize = calculateFilesize(bestFormat, duration);
                            const quality = `${bestFormat.height}p` as Quality
                            videoFormats.push({
                                quality: quality,
                                qualityHuman: qualityLabel,
                                resolution: resolution,
                                filesize: filesize,
                                filesizeHuman: formatFilesize(filesize),
                                fps: bestFormat.fps || null,
                                hasAudio: bestFormat.acodec && bestFormat.acodec !== 'none',
                                token: createToken({ id: id, type: 'video', title: title, quality: quality }, ip)
                            });
                            processedResolutions.add(resolution);
                        }
                    }
                });

                // Sort by resolution (descending)
                videoFormats.sort((a, b) => {
                    const aHeight = parseInt(a.quality.match(/\d+/)?.[0] || '0');
                    const bHeight = parseInt(b.quality.match(/\d+/)?.[0] || '0');
                    return bHeight - aHeight;
                });
            }
        }
        else {
            const tempAudioFormats: AudioFormat[] = []
            const processedAudioQualities = new Set<string>();


            if (info.formats && Array.isArray(info.formats)) {

                const audioOnly = info.formats.filter((format: any) =>
                    format.acodec && format.acodec !== 'none' &&
                    (!format.vcodec || format.vcodec === 'none')
                );


                audioOnly.forEach((format: any) => {
                    const abr = format.abr || 0;
                    const qualityHuman = abr >= 192 ? 'High'
                        : abr >= 128 ? 'Medium'
                            : 'Low';

                    // Only add unique quality levels
                    if (!processedAudioQualities.has(qualityHuman)) {
                        const filesize = calculateFilesize(format, duration);

                        tempAudioFormats.push({
                            quality: format.quality,
                            qualityHuman: qualityHuman,
                            filesize: filesize,
                            filesizeHuman: formatFilesize(filesize),
                            token: createToken({ id: id, type: 'audio', quality: format.quality, title: title }, ip)
                        });
                        processedAudioQualities.add(qualityHuman);
                    }
                });

                tempAudioFormats.sort((a, b) => b.filesize - a.filesize);
                audioFormats.push(tempAudioFormats[0])
            }
        }



        return res.status(200).send({
            success: true,
            info: {
                title,
                duration,
                durationHuman: `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`,
                thumbnail,
                uploader,
                videoFormats,
                audioFormats,
                rawFormatsCount: info.formats?.length || 0
            }
        });

    } catch (error) {
        console.error(error)
        return res.status(500).send({
            error: 'Failed to fetch video information',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}




