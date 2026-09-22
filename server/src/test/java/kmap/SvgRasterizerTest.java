package kmap;

import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class SvgRasterizerTest {

    @Test
    public void testRasterizeSvgToWebp() throws Exception {
        String svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 400 200\" width=\"400\" height=\"200\">"
                + "<rect width=\"400\" height=\"200\" fill=\"#336699\"/>"
                + "<circle cx=\"200\" cy=\"100\" r=\"50\" fill=\"#ffcc00\"/>"
                + "</svg>";

        File tempWebp = File.createTempFile("test-svg-", ".webp");
        tempWebp.deleteOnExit();

        try (ByteArrayInputStream in = new ByteArrayInputStream(svg.getBytes(StandardCharsets.UTF_8))) {
            SvgRasterizer.rasterizeToWebpFile(in, tempWebp, 800f);
        }

        assertTrue(tempWebp.exists());
        assertTrue(tempWebp.length() > 0);

        BufferedImage img = ImageIO.read(new FileInputStream(tempWebp));
        assertNotNull(img, "WebP image should be readable by ImageIO");
        assertEquals(800, img.getWidth(), "Width should be scaled to 800");
        assertEquals(400, img.getHeight(), "Height should be proportionally scaled to 400");
    }
}
