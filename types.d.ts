declare global {
    type Quality = '144p' | '240p' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '2160p'
    type AudioQuality = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

    type TokenInternalPayload =
        | {
            id: string;
            title: string;
            type: 'audio'
            quality: AudioQuality;
        }
        | {
            id: string;
            title: string;
            type: 'video'
            quality: Quality;
        };


    interface VideoFormat {
        quality: Quality;
        qualityHuman: string
        filesize: number;
        filesizeHuman: string;
        resolution: string;
        fps: number | null;
        hasAudio: boolean;
        token: string
    }

    interface AudioFormat {
        quality: AudioQuality;
        qualityHuman: 'High' | 'Medium' | 'Low'
        filesize: number;
        filesizeHuman: string;
        token: string
    }

}

export { };