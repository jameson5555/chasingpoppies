/* global process */
export const loadVideos = () => {
    const channelId = "UCwXXkWcM7_O1M5U2is5q18g";
    const apiKey = process.env.YOUTUBE_API_KEY;

    async function embedChannelVideos() {
        const playlistId = await getUploadsPlaylistId(channelId, apiKey); // Function to fetch playlist ID
        const videoList = await fetchVideoList(playlistId, apiKey); // Function to fetch video list
        const container = document.getElementById("video-container"); // Your container element

        // render the first 12 videos
        videoList.slice(0, 12).forEach(video => {
            const iframe = document.createElement("iframe");
            const videoItem = document.createElement("div");
            const thumbnail = document.createElement("img");
            const icon = document.createElement("i");

            iframe.src = `https://www.youtube.com/embed/${video.contentDetails.videoId}?rel=0`;
            iframe.width = "560";
            iframe.height = "315";
            iframe.style.border = "0";
            iframe.allowFullscreen = true;

            videoItem.classList.add("video-item", "ratio", "ratio-16x9");
            videoItem.appendChild(iframe);

            if (!('ontouchstart' in window || navigator.maxTouchPoints)) {
                thumbnail.src = video.snippet.thumbnails.standard.url;
                thumbnail.alt = video.snippet.title;
                videoItem.appendChild(thumbnail);

                icon.classList.add("fab", "fa-youtube");
                videoItem.appendChild(icon);
            }

            container.appendChild(videoItem);
        });
    }

    // Helper functions to fetch playlist ID and video list
    async function getUploadsPlaylistId(channelId, apiKey) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}&maxResults=50`);
        const data = await response.json();
        return data.items[0].contentDetails.relatedPlaylists.uploads;
    }

    // Helper function to parse ISO 8601 duration (e.g. PT1M5S) to seconds
    function parseDurationStr(duration) {
        const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
        
        let hours = (parseInt(match[1]) || 0);
        let minutes = (parseInt(match[2]) || 0);
        let seconds = (parseInt(match[3]) || 0);

        return hours * 3600 + minutes * 60 + seconds;
    }

    async function fetchVideoDurations(videoIds, apiKey) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds.join(',')}&key=${apiKey}`);
        const data = await response.json();
        

        // return map of id -> duration in seconds
        const map = data.items.reduce((acc, item) => {
            acc[item.id] = parseDurationStr(item.contentDetails.duration);
            return acc;
        }, {});
        
        
        return map;
    }

    async function fetchVideoList(playlistId, apiKey) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&key=${apiKey}&maxResults=50`);
        const data = await response.json();
        
        // Initial filter to remove absolute garbage without descriptions
        data.items = data.items.filter(item => item.snippet.description);
        
        // Extract IDs for fetching actual duration
        const videoIds = data.items.map(item => item.contentDetails.videoId);
        
        // Get durations in a single batch call
        const durationsMap = await fetchVideoDurations(videoIds, apiKey);

        // Filter out videos that are 60 seconds or shorter (YouTube Shorts)
        const regularVideos = data.items.filter(item => {
            const videoId = item.contentDetails.videoId;
            const durationInSeconds = durationsMap[videoId];
            return durationInSeconds > 60;
        });

        
        // Ensure we only ever return exactly 12 items for the UI
        return regularVideos.slice(0, 12);
    }

    // Call the function to embed videos
    embedChannelVideos(); 
};

// add a function that hides the img and i elements when the mouse hovers over divs with a class of "video-item"
export const playVideo = () => {
    document.body.addEventListener("mouseover", e => {
        if (e.target.closest(".video-item")) {
            e.target.closest(".video-item").classList.add("hovered");
        }
    });
};