package kmap;

import java.io.InputStream;

class AttachmentInputStream {
    public AttachmentInputStream(InputStream stream, String fileName, String mimeType, long contentLength) {
        this(stream, fileName, mimeType, contentLength, null);
    }

    public AttachmentInputStream(InputStream stream, String fileName, String mimeType, long contentLength, String digest) {
        this.stream = stream;
        this.fileName = fileName;
        this.mimeType = mimeType;
        this.contentLength = contentLength;
        this.digest = digest;
        this.responseCode = 200;
    }

    public AttachmentInputStream(int responseCode, String responseMessage) {
        this.responseCode = responseCode;
        this.responseMessage = responseMessage;
    }

    int responseCode;
    String responseMessage;

    InputStream stream;
    String fileName;
    String mimeType;
    long contentLength;
    String digest;
}
