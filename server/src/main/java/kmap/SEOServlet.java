package kmap;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.commons.collections.iterators.SingletonIterator;
import org.apache.commons.collections4.IteratorUtils;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;

import javax.xml.stream.XMLEventFactory;
import javax.xml.stream.XMLEventWriter;
import javax.xml.stream.XMLOutputFactory;
import javax.xml.stream.XMLStreamException;
import javax.xml.stream.events.*;
import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

import static kmap.JSON.*;

public class SEOServlet extends JsonServlet {
    private Couch couch;
    private Tests tests;
    private String file;

    @Override
    public void init() throws ServletException {
        super.init();
        couch = new Couch(properties);
        tests = new Tests(couch);
    }

    private String extractSubject(HttpServletRequest req) {
        String pathInfo = req.getPathInfo();
        System.out.println("pathInfo = " + pathInfo);
        if (pathInfo != null) {
            String[] path = pathInfo.substring(1).split("/");
            System.out.println("path = " + Arrays.asList(path));
            if (path.length == 1) {
                return path[0];
            }
        }
        return null;
    }

    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        newSessionHeader(req, resp);
        resp.setContentType("application/xml");
        resp.setCharacterEncoding("utf-8");

        String subject = extractSubject(req);
        try {
            Server.CLIENT.set("root");

            SortedMap<Element,Element> lines = new TreeMap<>(new Comparator<Element>() {
                @Override
                public int compare(Element o1, Element o2) {
                    return o1.selectFirst("a").text().compareTo(o2.selectFirst("a").text());
                }
            });

            if (subject != null) {
                JsonArray array = couch.latest(subject, 100000, false);
                List<JsonElement> list = toList(array);
                list.sort(Comparator.comparing((o) -> string((JsonObject)o, "chapter")).thenComparing((o) -> string((JsonObject)o, "topic")));
                for (JsonElement element : list) {
                    JsonObject card = (JsonObject) element;
                    String links = string(card, "links");
                    if (links != null)
                        continue;
                    Long created = loong(card, "created");
                    String thumb = string(card, "thumb");
                    String keywords = string(card, "keywords");
                    String meta = string(card, "meta");
                    boolean image = IteratorUtils.toList(card.getAsJsonArray("attachments").iterator()).stream().anyMatch(a -> {
                        String mime = string((JsonObject) a, "mime");
                        return mime != null && mime.startsWith("image/");
                    });
                    if (created != null && keywords != null && meta != null && (thumb != null || !image))
                        continue;

                    String chapter = string(card, "chapter");
                    String topic = string(card, "topic");
                    String url = "https://kmap.eu/app/browser/" + URLs.encode(subject) + "/" + URLs.encode(chapter) + "/" + URLs.encode(topic);
                    Element dt = new Element("dt");
                    dt.html("<a target=\"_blank\" href=\"" + url + "\">" + subject + " → " + chapter + " → " + topic + "</a>");
                    Element dd = new Element("dd");
                    Element ul = new Element("ul");
                    dd.appendChild(ul);

                    if (created == null)
                        ul.appendChild(new Element("li").text("created"));
                    if (thumb == null)
                        ul.appendChild(new Element("li").text("thumb"));
                    if (keywords == null)
                        ul.appendChild(new Element("li").text("keywords"));
                    if (meta == null)
                        ul.appendChild(new Element("li").text("meta"));

                    lines.put(dt, dd);
                }

                String html = "<html lang=\"de\"><head><meta charset=\"UTF-8\"><title>SEO Checks</title></head><body><dl></dl></body></html>";
                Document doc = Jsoup.parse(html);
                Element dl = doc.selectFirst("dl");
                for (Map.Entry<Element, Element> entry : lines.entrySet()) {
                    dl.appendChild(entry.getKey());
                    dl.appendChild(entry.getValue());
                }
                resp.setContentType("text/html");
                resp.setCharacterEncoding("utf-8");
                resp.getWriter().print(doc.outerHtml());
            }
        } catch (Exception e) {
            e.printStackTrace();
            sendError(req, resp, e);
        } finally {
            Server.CLIENT.remove();
        }
    }
}
