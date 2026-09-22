package kmap;

import org.apache.batik.transcoder.TranscoderException;
import org.apache.batik.transcoder.TranscoderInput;
import org.apache.batik.transcoder.TranscoderOutput;
import org.apache.batik.transcoder.image.ImageTranscoder;
import org.apache.batik.transcoder.image.PNGTranscoder;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;

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
        BufferedImageTranscoder transcoder = new BufferedImageTranscoder();
        if (width > 0) {
            transcoder.addTranscodingHint(PNGTranscoder.KEY_WIDTH, width);
        }
        TranscoderInput input = new TranscoderInput(svgStream);
        transcoder.transcode(input, null);
        return transcoder.getBufferedImage();
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
