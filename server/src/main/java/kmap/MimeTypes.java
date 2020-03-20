package kmap;

import java.util.HashMap;
import java.util.Map;

public class MimeTypes
{
    static final Map<String, String> MIME_TYPES = new HashMap<>();
    static {
        MimeTypes.MIME_TYPES.put("csv", "text/comma-separated-values");
        MimeTypes.MIME_TYPES.put("ggb", "application/vnd.geogebra.file");
        MimeTypes.MIME_TYPES.put("html", "text/html");
        MimeTypes.MIME_TYPES.put("gif", "image/gif");
        MimeTypes.MIME_TYPES.put("jpg", "image/jpeg");
        MimeTypes.MIME_TYPES.put("png", "image/png");
        MimeTypes.MIME_TYPES.put("txt", "text/plain");
        MimeTypes.MIME_TYPES.put("mpeg", "video/mpeg");
        MimeTypes.MIME_TYPES.put("mpg", "video/mpeg");
        MimeTypes.MIME_TYPES.put("mpe", "video/mpeg");
        MimeTypes.MIME_TYPES.put("mp4", "video/mp4");
    }

    static String guessType(String fileName) {
        int pos = fileName.lastIndexOf('.');
        String fileExtension = fileName.substring(pos + 1);
        return MIME_TYPES.getOrDefault(fileExtension, "application/octet-stream");
    }
}
