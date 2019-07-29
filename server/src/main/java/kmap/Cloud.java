package kmap;

import org.apache.http.HttpHost;
import org.apache.http.StatusLine;
import org.apache.http.annotation.NotThreadSafe;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.*;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.BasicAuthCache;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.JDOMException;
import org.jdom2.Namespace;
import org.jdom2.filter.ElementFilter;
import org.jdom2.input.SAXBuilder;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;
import java.net.URI;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.*;
import java.util.function.Consumer;
import java.util.stream.Collectors;

public class Cloud extends Server
{
    static final String PROPFIND_DIR = "<?xml version=\"1.0\"?>\n" +
        "<d:propfind xmlns:d=\"DAV:\" xmlns:oc=\"http://owncloud.org/ns\" xmlns:nc=\"http://nextcloud.org/ns\">\n" +
        "    <d:prop>\n" +
        "        <d:resourcetype/>\n" +
        "        <d:getcontenttype/>\n" +
        "        <oc:fileid/>\n" +
        "        <oc:size/>\n" +
        "        <nc:has-preview/>\n" +
        "    </d:prop>\n" +
        "</d:propfind>\n";
    static final String PROPFIND_TAG = "<?xml version=\"1.0\"?>\n" +
        "<d:propfind xmlns:d=\"DAV:\" xmlns:oc=\"http://owncloud.org/ns\">\n" +
        "<d:prop>\n" +
        "    <oc:id/>\n" +
        "    <oc:display-name/>\n" +
        "</d:prop>\n" +
        "</d:propfind>";

    static final String PROPFIND_TAGS = "<?xml version=\"1.0\" encoding=\"utf-8\" ?>\n" +
            "<a:propfind xmlns:a=\"DAV:\" xmlns:oc=\"http://owncloud.org/ns\">\n" +
            "  <a:prop>\n" +
            "    <oc:display-name/>\n" +
            "    <oc:id/>\n" +
            "  </a:prop>\n" +
            "</a:propfind>";

    private final Namespace d = Namespace.getNamespace("d", "DAV:");
    private final Namespace oc = Namespace.getNamespace("oc", "http://owncloud.org/ns");
    private CloseableHttpClient client;

    public Cloud(Properties properties) {
        super(properties);
    }

    public String createDirectory(String... dirs) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            String files = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get();

            String path = "";
            for (String dir : dirs) {
                path += "/" + encode(dir);
                try (CloseableHttpResponse ignored = client.execute(new HttpMKCol(files + path), context)){}
            }

            return (getProperty("cloud.url") + getProperty("cloud.links") + "/" + Server.CLIENT.get()) + path;
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    class AttachmentStream {
        public AttachmentStream(InputStream stream, String mimeType, long contentLength) {
            this.stream = stream;
            this.mimeType = mimeType;
            this.contentLength = contentLength;
            this.responseCode = 200;
        }

        public AttachmentStream(int responseCode, String responseMessage) {
            this.responseCode = responseCode;
            this.responseMessage = responseMessage;
        }

        int responseCode;
        String responseMessage;
        InputStream stream;
        String mimeType;
        long contentLength;
    }

    public void loadAttachment(Consumer<AttachmentStream> sender, String... dirs) throws IOException {
        CloseableHttpClient client = client();

        HttpClientContext context = clientContext();

        String files = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get();

        String path = Arrays.stream(dirs).map(this::encode).collect(Collectors.joining("/"));

        HttpGet get = new HttpGet(files + "/" + path);
        try (CloseableHttpResponse response = client.execute(get, context)) {
            StatusLine statusLine = response.getStatusLine();
            sender.accept(statusLine.getStatusCode() == 200
                    ? new AttachmentStream(response.getEntity().getContent(), response.getEntity().getContentType().getValue(), response.getEntity().getContentLength())
                    : new AttachmentStream(statusLine.getStatusCode(), statusLine.getReasonPhrase()));
        }
    }

    private HttpClientContext clientContext() {
        HttpHost targetHost = new HttpHost(getProperty("cloud.host"), Integer.valueOf(getProperty("cloud.port")), "https");
        CredentialsProvider credsProvider = new BasicCredentialsProvider();
        credsProvider.setCredentials(new AuthScope(targetHost.getHostName(), targetHost.getPort()), new UsernamePasswordCredentials(getProperty("cloud.user"), getProperty("cloud.password")));
        AuthCache authCache = new BasicAuthCache();
        BasicScheme basicAuth = new BasicScheme();
        authCache.put(targetHost, basicAuth);
        HttpClientContext context = HttpClientContext.create();
        context.setCredentialsProvider(credsProvider);
        context.setAuthCache(authCache);
        return context;
    }

    List<Attachment> findAttachments(String subject, String chapter, String topic) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            String uri = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get() + "/" + encode(subject) + "/" + encode(chapter) + "/" + encode(topic) + "/";
            System.out.println("uri = " + uri);
            HttpPropFind propfind = new HttpPropFind(uri);
            propfind.setEntity(new StringEntity(PROPFIND_DIR, ContentType.APPLICATION_XML));
            try (CloseableHttpResponse response = client.execute(propfind, context)) {
                List<Attachment> attachments = new ArrayList<>();
                Document dom = new SAXBuilder().build(response.getEntity().getContent());
                for (Element element : dom.getRootElement().getDescendants(new ElementFilter("response", d))) {
                    if (element.getDescendants(new ElementFilter("collection", d)).hasNext())
                        continue;
                    String fileId = fileId(element);
                    String fileName = fileName(element);
                    String fileType = fileType(element);
                    fileType = MimeTypes.tweakMimeType(fileType, fileName);
                    String fileTag = fileTag(client, context, fileId);
                    if (fileTag == null)
                        System.out.println("no tag " + fileName);

                    Attachment attachment = new Attachment(fileId, fileName, fileType, fileTag != null ? fileTag.substring("kmap-".length()) : null);
                    attachments.add(attachment);
                    System.out.println(attachment);
                }
                return attachments;
            }
        }
        catch (IOException | JDOMException e) {
            throw new RuntimeException(e);
        }
    }

    private String fileId(Element element) {
        return element.getDescendants(new ElementFilter("fileid", oc)).next().getText();
    }

    private String fileName(Element element) {
        Element child = element.getChild("href", d);
        String path = child.getText();
        path = decode(path);
        int pos = path.lastIndexOf('/');
        return path.substring(pos + 1);
    }

    private String fileType(Element element) {
        return element.getDescendants(new ElementFilter("getcontenttype", d)).next().getText();
    }

    private String fileTag(CloseableHttpClient client, HttpClientContext context, String fileid) throws IOException, JDOMException {
        HttpPropFind propfind = new HttpPropFind(getProperty("cloud.url") + "remote.php/dav/systemtags-relations/files/" + fileid);
        propfind.setEntity(new StringEntity(PROPFIND_TAG, ContentType.APPLICATION_XML));
        try (CloseableHttpResponse response = client.execute(propfind, context)) {
            //IOUtils.copy(response.getEntity().getContent(), System.out);
            Document dom = new SAXBuilder().build(response.getEntity().getContent());
            System.out.println();
            for (Element element : dom.getRootElement().getDescendants(new ElementFilter("display-name", oc))) {
                if (element.getContentSize() != 0)
                    return element.getText();
            }
            return null;
        }
    }

    private String dirName(Element element) {
        Element child = element.getChild("href", d);
        String path = child.getText();
        path = decode(path);
        path = path.substring(0, path.length() - 1);
        int pos = path.lastIndexOf('/');
        return path.substring(pos + 1);
    }

    private String encode(String string) {
        try {
            return URLEncoder.encode(string, "UTF-8").replace("+", "%20");
        }
        catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    private String decode(String string) {
        try {
            return URLDecoder.decode(string, "UTF-8");
        }
        catch (UnsupportedEncodingException e) {
            throw new RuntimeException(e);
        }
    }

    Map<String,String> listTags(String path) {
        Map<String,String> map = new HashMap<>();
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            String uri = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get() + "/" + path;
            HttpPropFind propfind = new HttpPropFind(uri);
            propfind.setEntity(new StringEntity(PROPFIND_DIR, ContentType.APPLICATION_XML));
            try (CloseableHttpResponse response = client.execute(propfind, context)) {
                Document dom = new SAXBuilder().build(response.getEntity().getContent());
                boolean first = true;
                for (Element element : dom.getRootElement().getDescendants(new ElementFilter("response", d))) {
                    if (first) {
                        first = false;
                        continue;
                    }
                    if (element.getDescendants(new ElementFilter("collection", d)).hasNext()) {
                        String dirName = dirName(element);
                        System.out.println("dir:  " + dirName);
                        map.putAll(listTags(path + "/" + encode(dirName)));
                    }
                    else {
                        String fileId = fileId(element);
                        String fileName = fileName(element);
                        String fileTag = fileTag(client, context, fileId);

                        if (fileTag != null) {
                            map.put(path + "/" + encode(fileName), fileTag);
                        }
                    }
                }
            }
        }
        catch (IOException | JDOMException e) {
            throw new RuntimeException(e);
        }
        return map;
    }

    public void transferTags(Map<String,String> map) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            Map<String, String> ids = new HashMap<>();

            String uri = getProperty("cloud.url") + getProperty("cloud.tags");
            HttpPropFind propfind = new HttpPropFind(uri);
            propfind.setEntity(new StringEntity(PROPFIND_TAGS, ContentType.APPLICATION_XML));
            try (CloseableHttpResponse response = client.execute(propfind, context)) {
                Document dom = new SAXBuilder().build(response.getEntity().getContent());
                for (Element element : dom.getRootElement().getDescendants(new ElementFilter("response", d))) {
                    String id = tagId(element);
                    String name = tagName(element);
                    if (name.startsWith("kmap-"))
                        ids.put(name, id);
                }
            }
            System.out.println("ids = " + ids);
            for (Map.Entry<String, String> entry : map.entrySet()) {
                String file = entry.getKey();
                String tag = entry.getValue();
                System.out.println(file + "/" + tag);

                String fileId = fileId(file);
                String tagId = ids.get(tag);
                uri = getProperty("cloud.url") + getProperty("cloud.tags-relations") + "/" + fileId + "/" + tagId;
                HttpPut put = new HttpPut(uri);
                try (CloseableHttpResponse response = client.execute(put, context)) {
                    System.out.println("response = " + response);
                }
            }
        }
        catch (IOException | JDOMException e) {
            throw new RuntimeException(e);
        }
    }

    private String fileId(String path) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();
            String uri = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get() + "/" + path;
            HttpPropFind propfind = new HttpPropFind(uri);
            propfind.setEntity(new StringEntity(PROPFIND_DIR, ContentType.APPLICATION_XML));
            try (CloseableHttpResponse response = client.execute(propfind, context)) {
                Document dom = new SAXBuilder().build(response.getEntity().getContent());
                for (Element element : dom.getRootElement().getDescendants(new ElementFilter("response", d))) {
                    return fileId(element);
                }
                return null;
            }
        }
        catch (IOException | JDOMException e) {
            throw new RuntimeException(e);
        }
    }

    private String tagId(Element element) {
        return element.getDescendants(new ElementFilter("id", oc)).next().getText();
    }

    private String tagName(Element element) {
        return element.getDescendants(new ElementFilter("display-name", oc)).next().getText();
    }

    public static void main(String[] args) throws IOException {
        Cloud cloud = new Cloud(readProperties(args[0]));
        //List<Attachment> attachments = cloud.findAttachments("mathe", "Differentialrechnung", "Graphisches Ableiten");
        //System.out.println("attachments = " + attachments);
        CLIENT.set("");
        Map<String, String> tags = cloud.listTags("Mathematik");
        System.out.println("tags = " + tags);
        CLIENT.set("test");
        cloud.transferTags(tags);
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

    private static Properties readProperties(String fileName) throws IOException {
        Properties properties = new Properties();
        properties.load(new FileInputStream(fileName));
        return properties;
    }

    synchronized CloseableHttpClient client() {
        if (client == null) {
            client = HttpClientBuilder.create().setConnectionManager(new PoolingHttpClientConnectionManager()).build();
        }
        return client;
    }

    @NotThreadSafe
    public class HttpPropFind extends HttpEntityEnclosingRequestBase {

        final static String METHOD_NAME = "PROPFIND";

        public HttpPropFind(final String uri) {
            super();
            setURI(URI.create(uri));
        }

        @Override
        public String getMethod() {
            return METHOD_NAME;
        }
    }

    @NotThreadSafe
    public class HttpMKCol extends HttpRequestBase {

        final static String METHOD_NAME = "MKCOL";

        public HttpMKCol(final String uri) {
            super();
            setURI(URI.create(uri));
        }

        @Override
        public String getMethod() {
            return METHOD_NAME;
        }
    }

    static class Attachment {
        String id;
        String name;
        String tag;
        String type;
        String href;

        public Attachment(String fileId, String fileName, String fileType, String fileTag) {
            id = fileId;
            name = fileName;
            type = fileType;
            tag = fileTag;
        }

        @Override
        public String toString() {
            return "{" +
                "id='" + id + '\'' +
                ", name='" + name + '\'' +
                ", tag='" + tag + '\'' +
                ", type='" + type + '\'' +
                '}';
        }
    }
}
