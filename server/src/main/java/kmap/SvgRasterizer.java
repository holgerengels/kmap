package kmap;

import org.apache.batik.transcoder.TranscoderException;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.ImageTranscoder;
import org.apache.batik.transcoder.image.PNGTranscoder;
import org.apache.commons.io.IOUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Attribute;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.parser.Parser;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SvgRasterizer {

    private static class BufferedImageTranscoder extends ImageTranscoder {
        private BufferedImage image = null;

        @Override
        public BufferedImage createImage(int width, int height) {
            return new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        }

        @Override
        public void writeImage(BufferedImage img, TranscoderOutput output) {
            this.image = img;
        }

        public BufferedImage getBufferedImage() {
            return image;
        }
    }

    public static BufferedImage rasterize(InputStream svgStream, float width) throws TranscoderException {
        byte[] bytes;
        try {
            bytes = IOUtils.toByteArray(svgStream);
        } catch (IOException e) {
            throw new TranscoderException(e);
        }

        try {
            return doRasterize(bytes, width);
        } catch (TranscoderException e) {
            // Attempt recovery by sanitizing broken references like missing #clip1, #mask1, etc.
            byte[] sanitized = sanitizeSvg(bytes);
            if (sanitized != bytes) {
                return doRasterize(sanitized, width);
            }
            throw e;
        }
    }

    private static BufferedImage doRasterize(byte[] svgBytes, float width) throws TranscoderException {
        BufferedImageTranscoder transcoder = new BufferedImageTranscoder();
        if (width > 0) {
            transcoder.addTranscodingHint(PNGTranscoder.KEY_WIDTH, width);
        }
        TranscoderInput input = new TranscoderInput(new ByteArrayInputStream(svgBytes));
        input.setURI("file:///kmap.svg");
        transcoder.transcode(input, null);
        return transcoder.getBufferedImage();
    }

    public static byte[] sanitizeSvg(byte[] svgBytes) {
        try {
            Document doc = Jsoup.parse(new ByteArrayInputStream(svgBytes), "UTF-8", "", Parser.xmlParser());
            doc.outputSettings().prettyPrint(false).syntax(Document.OutputSettings.Syntax.xml);

            Set<String> existingIds = new HashSet<>();
            for (Element el : doc.select("[id]")) {
                String id = el.id();
                if (id != null && !id.trim().isEmpty()) {
                    existingIds.add(id.trim());
                }
            }

            Pattern urlPattern = Pattern.compile("url\\(\\s*['\"]?#([^)'\"]+)['\"]?\\s*\\)");
            boolean modified = false;

            for (Element el : doc.getAllElements()) {
                for (Attribute attr : el.attributes().asList()) {
                    String val = attr.getValue();
                    if (val == null || !val.contains("#")) {
                        continue;
                    }

                    if ("style".equalsIgnoreCase(attr.getKey())) {
                        Matcher matcher = urlPattern.matcher(val);
                        StringBuffer sb = new StringBuffer();
                        boolean styleChanged = false;
                        while (matcher.find()) {
                            String refId = matcher.group(1);
                            if (!existingIds.contains(refId)) {
                                matcher.appendReplacement(sb, "none");
                                styleChanged = true;
                            } else {
                                matcher.appendReplacement(sb, Matcher.quoteReplacement(matcher.group(0)));
                            }
                        }
                        matcher.appendTail(sb);
                        if (styleChanged) {
                            el.attr(attr.getKey(), sb.toString());
                            modified = true;
                        }
                    } else {
                        Matcher matcher = urlPattern.matcher(val);
                        if (matcher.find()) {
                            String refId = matcher.group(1);
                            if (!existingIds.contains(refId)) {
                                el.removeAttr(attr.getKey());
                                modified = true;
                            }
                        } else if (("href".equalsIgnoreCase(attr.getKey()) || attr.getKey().toLowerCase().endsWith(":href")) && val.startsWith("#")) {
                            String refId = val.substring(1);
                            if (!existingIds.contains(refId)) {
                                el.removeAttr(attr.getKey());
                                modified = true;
                            }
                        }
                    }
                }
            }

            return modified ? doc.outerHtml().getBytes(StandardCharsets.UTF_8) : svgBytes;
        } catch (Exception e) {
            return svgBytes;
        }
    }

    public static void rasterizeToWebp(InputStream svgStream, OutputStream webpOut, float width) throws IOException, TranscoderException {
        BufferedImage img = rasterize(svgStream, width);
        if (img == null) {
            throw new IOException("Failed to transcode SVG to BufferedImage");
        }
        boolean written = ImageIO.write(img, "webp", webpOut);
        if (!written) {
            throw new IOException("No ImageWriter found for WebP format");
        }
    }

    public static void rasterizeToWebpFile(InputStream svgStream, File webpFile, float width) throws IOException, TranscoderException {
        File parent = webpFile.getParentFile();
        if (parent != null && !parent.exists()) {
            parent.mkdirs();
        }
        File tempFile = new File(parent, webpFile.getName() + ".tmp." + System.nanoTime());
        try (OutputStream out = new BufferedOutputStream(new FileOutputStream(tempFile))) {
            rasterizeToWebp(svgStream, out, width);
        }
        if (!tempFile.renameTo(webpFile)) {
            if (webpFile.delete() && tempFile.renameTo(webpFile)) {
                return;
            }
            throw new IOException("Failed to rename temporary WebP file to " + webpFile);
        }
    }
}
