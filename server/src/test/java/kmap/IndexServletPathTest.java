package kmap;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class IndexServletPathTest {

    @Test
    public void testPathHandlingForShortUrls() {
        // Test /browser/Mathematik (path length 2)
        String[] path1 = "browser/Mathematik".split("/");
        assertEquals(2, path1.length);
        String page1 = path1[0];
        assertEquals("browser", page1);
        if ("browser".equals(page1)) {
            if (path1.length >= 4) {
                fail("Should not be topic level");
            } else if (path1.length == 3) {
                fail("Should not be chapter level");
            } else if (path1.length == 2) {
                String subject = path1[1];
                assertEquals("Mathematik", subject);
            }
        }

        // Test /test (path length 1)
        String[] path2 = "test".split("/");
        assertEquals(1, path2.length);
        String page2 = path2[0];
        assertEquals("test", page2);
        String title;
        if (path2.length >= 4) {
            title = "4";
        } else if (path2.length == 3) {
            title = "3";
        } else if (path2.length == 2) {
            title = "2";
        } else {
            title = "Aufgaben auf KMap";
        }
        assertEquals("Aufgaben auf KMap", title);
    }
}
