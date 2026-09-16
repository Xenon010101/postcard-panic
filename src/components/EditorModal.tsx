import { useEffect, useRef, useState } from "react";
import ImageEditor, {
  type ImageEditorOptions,
  type ImageEditorRef,
} from "@unlayer/react-image-editor";
import {
  ArrowRight,
  Check,
  Copy,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { makePostcard } from "../game/postcard";

const options: ImageEditorOptions = {
  theme: "light",
  features: {
    imageEditor: {
      tools: {
        crop: false,
        resize: false,
        filter: false,
        draw: true,
        text: true,
        shapes: true,
        stickers: false,
        frame: false,
      },
    },
    ai: { enabled: false, assistant: false },
  },
};
export default function EditorModal({
  image,
  onSave,
  onClose,
}: {
  image: string;
  onSave: (image: string) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    editor = useRef<ImageEditorRef>(null),
    mount = useRef<HTMLDivElement>(null);
  const [editorHeight, setEditorHeight] = useState(400);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0),
    [saving, setSaving] = useState(false),
    [copied, setCopied] = useState(false);
  useEffect(() => {
    const el = dialog.current!;
    el.showModal();
    const previous = document.activeElement;
    return () => {
      el.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(
      () =>
        setError(
          "The editor is taking longer than expected. Check your connection, then try again.",
        ),
      25000,
    );
    return () => clearTimeout(timer);
  }, [ready, attempt]);
  useEffect(() => {
    const el = mount.current!;
    const observer = new ResizeObserver(() =>
      setEditorHeight(Math.max(250, Math.floor(el.clientHeight))),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const save = async (dataUrl?: string) => {
    const data = dataUrl || editor.current?.editor?.getImage();
    if (!data) {
      setError("The postcard is still loading. Try again in a moment.");
      return;
    }
    setSaving(true);
    try {
      await onSave(data);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save this postcard.",
      );
      setSaving(false);
    }
  };
  return (
    <dialog
      className="editor-dialog"
      ref={dialog}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="editor-title"
    >
      <div className="editor-heading">
        <div>
          <span className="eyebrow">THE PLAN IS IN YOUR HANDS</span>
          <h2 id="editor-title">Mark your escape.</h2>
        </div>
        <div className="editor-actions">
          <button
            className="btn primary"
            disabled={!ready || saving}
            onClick={() => void save()}
          >
            {saving ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              <Check size={17} />
            )}{" "}
            Save & check route
          </button>
          <button
            className="icon-button"
            aria-label="Cancel editing"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
      </div>
      <div className="editor-instructions">
        <span>
          <b>1.</b> Select <strong>Draw</strong>
        </span>
        <ArrowRight size={13} />
        <span>
          <b>2.</b> Pen color{" "}
          <button
            className="color-copy"
            onClick={() => {
              void navigator.clipboard
                ?.writeText("#00D8FF")
                .then(() => setCopied(true))
                .catch(() => setCopied(false));
            }}
          >
            <i />
            #00D8FF {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>{" "}
          · 8–12 px
        </span>
        <ArrowRight size={13} />
        <span>
          <b>3.</b> Trace streets from <strong>A</strong> to <strong>B</strong>
        </span>
      </div>
      {error && (
        <div className="editor-error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => {
              setError("");
              setReady(false);
              setAttempt((n) => n + 1);
            }}
          >
            <RefreshCw size={14} /> Retry editor
          </button>
        </div>
      )}
      <div className="editor-mount" ref={mount}>
        {!ready && !error && (
          <div className="editor-loading">
            <LoaderCircle className="spin" /> Opening your postcard…
          </div>
        )}
        <ImageEditor
          key={attempt}
          ref={editor}
          image={image}
          options={options}
          minHeight={editorHeight}
          style={{ height: editorHeight, width: "100%" }}
          onLoad={() => {
            setReady(true);
            setError("");
          }}
          onSave={({ dataUrl }) => void save(dataUrl)}
          onCancel={onClose}
          onLoadError={() =>
            setError(
              "The editor could not load this postcard. Retry to reload the original image.",
            )
          }
          onError={() =>
            setError(
              "The image editor could not connect. Check your connection and retry. Your saved postcard is safe.",
            )
          }
        />
      </div>
      <div className="editor-footnote">
        <button
          className="text-button"
          disabled={!ready}
          onClick={() => {
            void editor.current?.editor?.reset(makePostcard());
          }}
        >
          <RefreshCw size={12} /> Fresh map (clears all ink)
        </button>
        <span>
          Keep the corner marks. Close brush settings for more drawing room.
        </span>
        <span>Powered by Unlayer React Image Editor</span>
      </div>
    </dialog>
  );
}
