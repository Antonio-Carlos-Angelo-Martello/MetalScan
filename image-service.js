(function () {
  window.ImageService = {
    isSupported(file) {
      return Boolean(file && ["image/jpeg", "image/png", "image/webp", "image/heic"].includes(file.type));
    },
    getSource(file, capturedBlob) {
      return file || capturedBlob || null;
    },
    createPreview(file) {
      return file ? URL.createObjectURL(file) : "";
    }
  };
})();
