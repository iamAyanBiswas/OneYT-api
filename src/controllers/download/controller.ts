import { FastifyRequest, FastifyReply } from 'fastify';
import { YtDlp } from 'ytdlp-nodejs';
import { PassThrough, Readable } from 'stream';
import { verifyToken } from '@/lib/token';
import { getSafeVideoURL } from '@/lib/utils';

const qualitys: Quality[] = ['144p', '240p', '360p', '480p', '720p', '1080p', '1440p', '2160p']
interface Querystring {
    token: string
}
export async function downloadController(req: FastifyRequest<{ Querystring: Querystring }>, res: FastifyReply) {
    const { token } = req.query

    if (!token) {
        return res.status(400).send({ error: 'Token is required' });
    }

    try {
        let id: string, type: 'audio' | 'video', quality: Quality | AudioQuality, title: string

        try {
            const ip = req.ip
            const data = verifyToken(token, ip)
            id = data.id, type = data.type, quality = data.quality, title = data.title
        } catch (error) {
            return res.status(400).send({ error: (error as Error)?.message })
        }

        const url = getSafeVideoURL(id);


        if (!url) {
            return res.status(400).send({ error: 'URL is required' });
        }
        if (type !== 'audio' && type !== 'video') {
            return res.status(400).send({ error: 'Please provide valid type' });
        }
        if (type === 'video') {
            if (!quality) {
                res.status(400).send({ error: 'quality is required' });
            }
            if (!qualitys.includes(quality as Quality)) {
                res.status(400).send({ error: 'Please provide valid video quality' });
            }
        }

        const ytdlp = new YtDlp();
        try {
            await ytdlp.downloadFFmpeg();
        } catch (error) {
            console.error('Failed to download FFmpeg:', error);
            // Continue, as it might already be there or not needed for some formats
        }


        // Create a PassThrough stream to act as the bridge
        const stream = new PassThrough();

        let formatOptions: { filter: 'mergevideo' | 'audioonly', quality: Quality | AudioQuality, type: 'mp3' | 'mp4' | 'mkv' } = {
            filter: 'mergevideo',
            quality: '360p',
            type: 'mkv'
        };

        if (type === 'audio') {
            // Audio quality: 0 is best, 10 is worst. Default to 0 (highest).
            // If user passes 'highest', map to 0.

            formatOptions = {
                filter: 'audioonly',
                quality: 2,
                type: 'mp3'
            };
        } else {
            // Video
            formatOptions = {
                filter: 'mergevideo',
                quality: quality,
                type: 'mkv'
            };
        }

        // Use the stream method from ytdlp-nodejs
        // It returns an object with a pipe method
        const ytdlpStream = ytdlp.stream(url, {
            format: formatOptions,
        });

        ytdlpStream.pipe(stream);

        // Convert Node.js Readable stream to Web ReadableStream
        // @ts-ignore - Readable.toWeb is available in recent Node.js versions
        const webStream = Readable.toWeb(stream);

        // Sanitize filename to remove non-ASCII characters
        const sanitizeFilename = (name: string) => {
            return name
                .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
                .replace(/[<>:"/\\|?*]/g, '_') // Replace invalid filename characters
                .trim()
                .substring(0, 200) // Limit length
                || 'download'; // Fallback if empty
        };

        const sanitizedTitle = sanitizeFilename(title);
        const filename = type === 'audio' ? `${sanitizedTitle}_audio.mp3` : `${sanitizedTitle}_video(${quality}).mp4`;
        const contentType = type === 'audio' ? 'audio/mpeg' : 'video/mp4';

        return new Response(webStream as any, {
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    } catch (error) {
        return res.status(500).send({ error: 'Failed to stream video' });
    }
}
