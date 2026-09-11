import { useCallback, useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';
import { clsx } from 'clsx';

interface FileUploaderProps {
  onFile: (file: File) => void;
  accept?: string;
  label?: string;
  isLoading?: boolean;
}

export function FileUploader({
  onFile,
  accept = '.csv,.txt,text/csv,text/plain',
  label = 'Drop CSV or TXT file here, or click to browse',
  isLoading = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      onFile(file);
    },
    [onFile]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onInputChange}
        className="hidden"
        aria-label="Upload leads file"
      />
      {fileName ? (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm text-green-700 font-medium flex-1 truncate">{fileName}</span>
          {!isLoading && (
            <button onClick={clear} className="text-green-500 hover:text-green-700">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          className={clsx(
            'w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 transition-colors cursor-pointer',
            isDragOver
              ? 'border-brand-500 bg-brand-50'
              : 'border-gray-200 hover:border-brand-400 hover:bg-gray-50'
          )}
        >
          <Upload className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600 text-center">{label}</span>
          <span className="text-xs text-gray-400">CSV or plain text, max 5MB</span>
        </button>
      )}
    </div>
  );
}
