import { useState } from "react";

export const useCopyToClipboard = () => {
  const [isCopiedToClipboard, setIsCopiedToClipboard] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      // Try using the Clipboard API first
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand("copy");
        } catch (err) {
          console.error("Fallback: Oops, unable to copy", err);
        }
        
        textArea.remove();
      }
      
      setIsCopiedToClipboard(true);
      setTimeout(() => {
        setIsCopiedToClipboard(false);
      }, 800);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return { copyToClipboard, isCopiedToClipboard };
};
