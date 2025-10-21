import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setErrors([]); // Clear any previous errors when successfully adding file
    }
  }, []);

  const onDropRejected = useCallback((fileRejections: FileRejection[]) => {
    if (fileRejections.length === 0) return;

    const errorMessages = fileRejections.map((rejection) => {
      const fileName = rejection.file.name;
      const errorCode = rejection.errors[0]?.code;

      switch (errorCode) {
        case "file-invalid-type":
          return `${fileName}: Invalid file type. Please upload .pdf, .doc, or .docx files only.`;
        case "file-too-large":
          return `${fileName}: File is too large. Maximum size is 10MB.`;
        case "too-many-files":
          return `Only one file is allowed. Please upload a single resume.`;
        default:
          return `${fileName}: Failed to upload. ${rejection.errors[0]?.message || "Unknown error"}`;
      }
    });

    setErrors(errorMessages);
    setTimeout(() => setErrors([]), 10000);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    multiple: false,
    maxSize: MAX_FILE_SIZE,
  });

  const removeFile = useCallback(() => {
    setFile(null);
  }, []);

  const removeError = useCallback((index: number) => {
    setErrors((prev) => prev.filter((_, i) => i !== index));
  }, []);

  return {
    file,
    errors,
    getRootProps,
    getInputProps,
    isDragActive,
    removeFile,
    removeError,
  };
}
