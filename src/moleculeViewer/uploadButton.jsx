import React, { useRef } from 'react';

const UploadButton = ({ setFile }) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile); 
    }
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept=".mol,.sdf,.xyz,.cub"
      />
    </div>
  );
};

export default UploadButton;


