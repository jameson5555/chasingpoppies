/* global process */
const channelId = "UCwXXkWcM7_O1M5U2is5q18g";
const apiKey = process.env.YOUTUBE_API_KEY;

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`YouTube request failed with ${response.status}`);
    }
    return response.json();
}

function durationInSeconds(duration) {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    return (Number(match[1] || 0) * 3600) + (Number(match[2] || 0) * 60) + Number(match[3] || 0);
}

async function getLatestVideos() {
    const channel = await fetchJson(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`);
    if (!channel.items || !channel.items[0]) throw new Error("YouTube channel was not found");

    const playlistId = channel.items[0].contentDetails.relatedPlaylists.uploads;
    const playlist = await fetchJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${playlistId}&key=${apiKey}&maxResults=50`);
    const items = (playlist.items || []).filter(item => item.snippet && item.snippet.title !== "Deleted video" && item.snippet.title !== "Private video");
    const ids = items.map(item => item.contentDetails.videoId);
    if (!ids.length) return [];

    const details = await fetchJson(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids.join(",")}&key=${apiKey}`);
    const durations = (details.items || []).reduce((map, item) => {
        map[item.id] = durationInSeconds(item.contentDetails.duration);
        return map;
    }, {});

    return items.filter(item => durations[item.contentDetails.videoId] > 60).slice(0, 9);
}

function createVideoCard(video, index) {
    const id = video.contentDetails.videoId;
    const title = video.snippet.title;
    const thumbnails = video.snippet.thumbnails || {};
    const thumbnail = thumbnails.maxres || thumbnails.standard || thumbnails.high || thumbnails.medium || thumbnails.default;
    const button = document.createElement("button");
    button.className = index === 0 ? "video-card video-card--feature" : "video-card";
    button.type = "button";
    button.dataset.videoId = id;

    const image = document.createElement("img");
    image.src = thumbnail ? thumbnail.url : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    image.alt = "";
    image.loading = "lazy";

    const shade = document.createElement("span");
    shade.className = "video-card__shade";
    const play = document.createElement("span");
    play.className = "video-card__play";
    play.setAttribute("aria-hidden", "true");
    play.textContent = "▶";
    const text = document.createElement("span");
    text.className = "video-card__text";
    const strong = document.createElement("strong");
    strong.textContent = title;
    const small = document.createElement("small");
    small.textContent = "Chasing Poppies · YouTube";
    text.append(strong, small);
    button.append(image, shade, play, text);
    return button;
}

export async function loadVideos() {
    const container = document.getElementById("video-container");
    if (!container || !apiKey) return;

    try {
        const videos = await getLatestVideos();
        if (videos.length) container.replaceChildren(...videos.map(createVideoCard));
    } catch (error) {
        // The curated HTML cards remain available when YouTube is unavailable.
    }
}
