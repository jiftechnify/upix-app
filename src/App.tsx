import { useState } from "react";
import styles from "./App.module.css";

const SUPPORTED_MIME_TYPES = [
  "image/png",
  "image/webp",
  "image/bmp",
  "image/gif",
];

type UploadedImage = {
  name: string;
  scale: number;
  width: number;
  height: number;
};

type UserError = {
  message: string;
};

function App() {
  const [file, setFile] = useState<File | undefined>(undefined);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedImgs, setUploadedImgs] = useState<UploadedImage[]>([]);

  const btnUploadDisabled = file === undefined || isUploading;

  const handleChangeFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] ?? undefined);
  };
  const handleSubmitUploadForm = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!file) {
      return;
    }
    if (SUPPORTED_MIME_TYPES.every((type) => file.type !== type)) {
      alert("Unsupported file type");
      return;
    }

    setIsUploading(true);
    setUploadedImgs([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch(import.meta.env.VITE_UPIX_API_URL, {
        method: "POST",
        body: formData,
      });
      if (resp.status >= 500) {
        alert(`Failed to upload: ${resp.status} ${resp.statusText}`);
        return;
      }
      if (resp.status >= 400) {
        const err = (await resp.json()) as UserError;
        alert(`Failed to upload: ${err.message}`);
        return;
      }
      if (!resp.ok) {
        alert(
          `Failed to upload: unexpected status: ${resp.status} ${resp.statusText}`,
        );
        return;
      }

      setUploadedImgs((await resp.json()) as UploadedImage[]);
    } catch (err) {
      alert(`Failed to upload: ${err}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <header>
        <h1>Upix</h1>
        <p>Uploader for pixel arts with automatic upscaling!</p>
      </header>

      <main>
        <h2>Upload Your Art</h2>
        <form onSubmit={handleSubmitUploadForm}>
          <input
            type="file"
            accept={SUPPORTED_MIME_TYPES.join(",")}
            onChange={handleChangeFile}
          />
          <button type="submit" disabled={btnUploadDisabled}>
            Upload
          </button>
        </form>

        {isUploading && <p>Uploading...</p>}
        {uploadedImgs.length > 0 && (
          <>
            <hr />
            <h2>Upload Succeeded!</h2>
            <ul className={styles.uploadedImageList}>
              {uploadedImgs.map((img) => (
                <UploadedImageItem key={img.scale} {...img} />
              ))}
            </ul>
          </>
        )}
      </main>
    </>
  );
}

function UploadedImageItem({ name, scale, width, height }: UploadedImage) {
  const imgUrl = `${import.meta.env.VITE_UPIX_IMG_BASE_URL}/${name}`;
  const scaleCaption = scale === 1 ? "Original" : `${scale}x`;
  const altText =
    scale === 1 ? "Original image" : `${scale} times upscaled ${scale} image`;

  const [copied, setCopied] = useState<boolean>(false);
  const handleClickCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(imgUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <li className={styles.uploadedImageItem}>
      <h3>{scaleCaption}</h3>
      <img src={imgUrl} alt={altText} {...{ width, height }} />
      <p>
        {width}x{height}
      </p>
      <button
        className={styles.btnCopyUrl}
        type="button"
        onClick={handleClickCopyUrl}
      >
        {copied ? "Copied!" : "Copy URL"}
      </button>
    </li>
  );
}

export default App;
