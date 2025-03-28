async function fetchPinterestData() {
    const url = document.getElementById('pinterestUrl').value;
    if (!url) {
        alert("Masukkan URL terlebih dahulu!");
        return;
    }

    try {
        const response = await fetch(`/api/search?url=${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data.error) {
            alert(data.error);
            return;
        }

        document.getElementById('title').innerText = data.title;
        document.getElementById('thumbnail').src = data.thumbnail;
        
        const mediaList = document.getElementById('media-list');
        mediaList.innerHTML = "";

        data.medias.forEach(media => {
            const div = document.createElement("div");
            div.className = "media-item";
            div.innerHTML = `<a href="${media.url}" target="_blank">Download Media</a>`;
            mediaList.appendChild(div);
        });

        document.getElementById('result').classList.remove('hidden');
    } catch (error) {
        alert("Gagal mengambil data.");
    }
}