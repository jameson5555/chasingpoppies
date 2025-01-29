export const loadVideos = () => {
    const channelId = "UCwXXkWcM7_O1M5U2is5q18g";
    const apiKey = "AIzaSyBQYf2y1M0OXDzXV8ePT-cZhzIHJLEVFW0";

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

    async function fetchVideoList(playlistId, apiKey) {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&key=${apiKey}&maxResults=50`);
        const data = await response.json();
        data.items = data.items.filter(item => item.snippet.description); // remove shorts
        return data.items;
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