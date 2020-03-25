package kmap;

import java.nio.file.Path;

class Upload {
    String fileName;
    String contentType;
    Path tmp;

    public Upload(String fileName, String contentType, Path tmp) {
        this.fileName = fileName;
        this.contentType = contentType;
        this.tmp = tmp;
    }

    public String getFileName() {
        return fileName;
    }

    public String getContentType() {
        return contentType;
    }

    public Path getTmp() {
        return tmp;
    }

    @Override
    public String toString() {
        return "Upload{" +
                "fileName='" + fileName + '\'' +
                ", contentType='" + contentType + '\'' +
                '}';
    }
}
