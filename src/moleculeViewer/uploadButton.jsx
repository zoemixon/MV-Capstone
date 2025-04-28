import React, { useRef } from 'react';

const UploadButton = ({ setFiles }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length > 0) {
      setFiles(selectedFiles);
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".mol,.sdf,.xyz,.cub"
        multiple
      />
    </div>
  );
};

export default UploadButton;


