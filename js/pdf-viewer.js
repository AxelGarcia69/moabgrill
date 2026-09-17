/* ==========================================================================
   MOAB GRILL — PDF menu viewer
   Renders the menu PDF inside the page (pdf.js) so it works on iPhone/Android
   without leaving the site. Each page is drawn to a canvas and swapped for a
   JPEG <img> to keep memory low on phones. Fallback: the "Open PDF" buttons.
   ========================================================================== */

import * as pdfjsLib from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";

const stage = document.querySelector("[data-pdf]");

/* ---------- "Back to menus": go back in history when the visitor came from
   the site, otherwise land on the menu hub ---------- */
document.querySelectorAll("[data-back]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const cameFromSite = document.referrer && document.referrer.startsWith(location.origin);
    if (cameFromSite && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  });
});

async function renderMenu() {
  if (!stage) return;
  const url = stage.dataset.pdf;
  // data-pages="2" o "2,3": muestra solo esas páginas (p. ej. para saltar una portada con QR)
  const only = (stage.dataset.pages || "").split(",").map((s) => parseInt(s, 10)).filter(Boolean);
  const status = stage.querySelector(".pdf-status");
  const setStatus = (msg) => { if (status) status.textContent = msg; };

  try {
    const task = pdfjsLib.getDocument({ url });
    task.onProgress = ({ loaded, total }) => {
      if (total) setStatus(`Loading menu… ${Math.min(99, Math.round((loaded / total) * 100))}%`);
    };
    const pdf = await task.promise;

    const width = Math.min(stage.clientWidth, 960);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    for (let i = 1; i <= pdf.numPages; i++) {
      if (only.length && !only.includes(i)) continue;
      const page = await pdf.getPage(i);
      const base = page.getViewport({ scale: 1 });
      const scale = width / base.width;
      const viewport = page.getViewport({ scale: scale * dpr });

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

      const img = new Image();
      img.className = "pdf-page";
      img.alt = `Menu page ${i} of ${pdf.numPages}`;
      img.width = width;
      img.height = Math.round(viewport.height / dpr);
      await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          img.src = URL.createObjectURL(blob);
          canvas.width = canvas.height = 0; // free the canvas memory
          resolve();
        }, "image/jpeg", 0.9);
      });
      stage.appendChild(img);
      page.cleanup();
    }

    if (status) status.remove();
    stage.classList.add("is-ready");
  } catch (err) {
    console.error("PDF viewer:", err);
    stage.classList.add("has-error");
    setStatus("We couldn't display the menu here. Tap “Open PDF” above to view it.");
  }
}

renderMenu();
