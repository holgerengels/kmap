package kmap;

import java.util.HashMap;
import java.util.Map;

public class MimeTypes
{
    static final Map<String, String> MIME_TYPES = new HashMap<>();
    static {
        MimeTypes.MIME_TYPES.put("ggb", "application/vnd.geogebra.file");
    }

    static String tweakMimeType(String mimeType, String fileName) {
        if (fileName.endsWith(".png"))
            return "image/png";
        if (fileName.endsWith(".html"))
            return "text/html";
        if (!"application/octet-stream".equals(mimeType))
            return mimeType;

        int pos = fileName.lastIndexOf('.');
        String fileExtension = fileName.substring(pos + 1);
        return MIME_TYPES.getOrDefault(fileExtension, "application/octet-stream");
    }
}
