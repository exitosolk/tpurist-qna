"use client";

import { useState, useRef } from "react";
import { Image, Video } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minLength?: number;
  userReputation?: number;
}

export default function MarkdownEditor({ value, onChange, placeholder, minLength, userReputation = 0 }: MarkdownEditorProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        // Insert markdown image syntax at cursor position
        const imageMarkdown = `\n![Image](${data.url})\n`;
        onChange(value + imageMarkdown);
      } else {
        alert(data.error || "Failed to upload image");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = document.querySelector("textarea") as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 px-3 py-2 flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => insertMarkdown("**", "**")}
          className="px-2 py-1 text-sm font-bold hover:bg-gray-200 rounded"
          title="Bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("*", "*")}
          className="px-2 py-1 text-sm italic hover:bg-gray-200 rounded"
          title="Italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => insertMarkdown("[Link text](url)")}
          className="px-2 py-1 text-sm hover:bg-gray-200 rounded"
          title="Link"
        >
          🔗
        </button>
        <div className="border-l mx-1"></div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || userReputation < 10}
          className={`px-2 py-1 text-sm rounded flex items-center gap-1 ${
            userReputation < 10
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-gray-200"
          }`}
          title={
            userReputation < 10
              ? "You need 10+ reputation to upload images"
              : "Upload image"
          }
        >
          <Image className="w-4 h-4" />
          {uploading ? "Uploading..." : "Image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Editor */}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
        required
      />

      {/* Footer */}
      <div className="border-t bg-gray-50 px-3 py-2 flex justify-between text-sm text-gray-600">
        <div>
          {minLength && (
            <span>
              {value.length} / {minLength} characters minimum
            </span>
          )}
        </div>
        <div>
          <a
            href="https://www.markdownguide.org/basic-syntax/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Markdown supported
          </a>
        </div>
      </div>
    </div>
  );
}
