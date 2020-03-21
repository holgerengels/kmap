package kmap;

import org.apache.http.HttpHost;
import org.apache.http.StatusLine;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.AuthCache;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.client.methods.*;
import org.apache.http.client.protocol.HttpClientContext;
import org.apache.http.entity.ContentType;
import org.apache.http.entity.InputStreamEntity;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.DefaultConnectionReuseStrategy;
import org.apache.http.impl.auth.BasicScheme;
import org.apache.http.impl.client.*;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.jdom2.Document;
import org.jdom2.Element;
import org.jdom2.JDOMException;
import org.jdom2.Namespace;
import org.jdom2.filter.ElementFilter;
import org.jdom2.input.SAXBuilder;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
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
    private static CloseableHttpClient client;

    public Cloud(Properties properties) {
        super(properties);
    }

    private HttpClientContext clientContext() {
        HttpHost targetHost = new HttpHost(getProperty("cloud.host"), Integer.parseInt(getProperty("cloud.port")), "https");
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

    synchronized CloseableHttpClient client() {
        if (client == null) {
            PoolingHttpClientConnectionManager connectionManager = new PoolingHttpClientConnectionManager();
            connectionManager.setMaxTotal(20);
            connectionManager.setDefaultMaxPerRoute(20);
            client = HttpClients.custom()
                    .setKeepAliveStrategy(DefaultConnectionKeepAliveStrategy.INSTANCE)
                    .setConnectionReuseStrategy(DefaultConnectionReuseStrategy.INSTANCE)
                    .setConnectionManager(connectionManager).build();

            new IdleConnectionMonitor(connectionManager).start();
        }
        return client;
    }

    public String createDirectory(String... dirs) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            String files = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get();

            try (CloseableHttpResponse ignored = client.execute(new HttpMKCol(files), context)){}
            String path = "";
            for (String dir : dirs) {
                path += "/" + JsonServlet.encode(dir);
                try (CloseableHttpResponse ignored = client.execute(new HttpMKCol(files + path), context)){}
            }

            return (getProperty("cloud.url") + getProperty("cloud.links") + "/" + Server.CLIENT.get()) + path;
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public void loadAttachment(Consumer<AttachmentInputStream> sender, String... dirs) throws IOException {
        CloseableHttpClient client = client();
        HttpClientContext context = clientContext();

        String files = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get();
        String path = Arrays.stream(dirs).map(JsonServlet::encode).collect(Collectors.joining("/"));

        HttpGet get = new HttpGet(files + "/" + path);
        try (CloseableHttpResponse response = client.execute(get, context)) {
            StatusLine statusLine = response.getStatusLine();
            if (statusLine.getStatusCode() == 200)
                System.out.println("Load " + path + " from cloud");

            sender.accept(statusLine.getStatusCode() == 200
                    ? new AttachmentInputStream(response.getEntity().getContent(), dirs[dirs.length-1], response.getEntity().getContentType().getValue(), response.getEntity().getContentLength())
                    : new AttachmentInputStream(statusLine.getStatusCode(), statusLine.getReasonPhrase()));
        }
    }

    public int storeAttachment(InputStream in, String... dirs) throws IOException {
        String[] lessDirs = Arrays.copyOf(dirs, dirs.length - 1);
        createDirectory(lessDirs);

        CloseableHttpClient client = client();
        HttpClientContext context = clientContext();

        String files = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get();
        String path = Arrays.stream(dirs).map(JsonServlet::encode).collect(Collectors.joining("/"));

        HttpPut put = new HttpPut(files + "/" + path);
        put.setEntity(new InputStreamEntity(in));
        try (CloseableHttpResponse response = client.execute(put, context)) {
            StatusLine statusLine = response.getStatusLine();
            return statusLine.getStatusCode();
        }
    }

    List<Attachment> findAttachments(String subject, String chapter, String topic, boolean tests) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            String uri = getProperty("cloud.url") + getProperty("cloud.files") + "/" + Server.CLIENT.get() + "/" + JsonServlet.encode(subject) + "/" + JsonServlet.encode(chapter) + "/" + JsonServlet.encode(topic) + "/";
            if (tests)
                uri += "/tests/";

            HttpPropFind propfind = new HttpPropFind(uri);
            propfind.setEntity(new StringEntity(PROPFIND_DIR, ContentType.APPLICATION_XML));
            List<Attachment> attachments = new ArrayList<>();
            try (CloseableHttpResponse response = client.execute(propfind, context)) {
                Document dom = new SAXBuilder().build(response.getEntity().getContent());
                for (Element element : dom.getRootElement().getDescendants(new ElementFilter("response", d))) {
                    if (element.getDescendants(new ElementFilter("collection", d)).hasNext())
                        continue;
                    String fileId = fileId(element);
                    String fileName = fileName(element);
                    Integer fileSize = fileSize(element);
                    String fileType = fileType(element);
                    fileType = MimeTypes.guessType(fileName);
                    Attachment attachment = new Attachment(fileId, fileName, fileType, fileSize);
                    attachments.add(attachment);
                }
            }
            for (Attachment attachment : attachments) {
                String fileTag = fileTag(client, context, attachment.id);
                if (fileTag != null)
                    attachment.tag = fileTag.substring("kmap-".length());
            }
            return attachments;
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
        path = JsonServlet.decode(path);
        int pos = path.lastIndexOf('/');
        return path.substring(pos + 1);
    }

    private Integer fileSize(Element element) {
        String text = element.getDescendants(new ElementFilter("size", oc)).next().getText();
        return text != null ? Integer.parseInt(text) : null;
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

    public void copy(String fromInstance, String toInstance, String[] file) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            HttpCopy copy = new HttpCopy(
                    getProperty("cloud.url") + getProperty("cloud.files") + "/" + fromInstance + "/" + Arrays.stream(file).map(JsonServlet::encode).collect(Collectors.joining("/")),
                    getProperty("cloud.url") + getProperty("cloud.files") + "/" + toInstance + "/" + Arrays.stream(file).map(JsonServlet::encode).collect(Collectors.joining("/")));

            try (CloseableHttpResponse response = client.execute(copy, context)) {
                System.out.println("copy response = " + response);
            }
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    public void delete(String instance, String[] file) {
        try {
            CloseableHttpClient client = client();
            HttpClientContext context = clientContext();

            HttpDelete delete = new HttpDelete(getProperty("cloud.url") + getProperty("cloud.files") + "/" + instance + "/" + Arrays.stream(file).map(JsonServlet::encode).collect(Collectors.joining("/")));
            try (CloseableHttpResponse response = client.execute(delete, context)) {
                System.out.println("delete response = " + response);
            }
        }
        catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private String dirName(Element element) {
        Element child = element.getChild("href", d);
        String path = child.getText();
        path = JsonServlet.decode(path);
        path = path.substring(0, path.length() - 1);
        int pos = path.lastIndexOf('/');
        return path.substring(pos + 1);
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
                        map.putAll(listTags(path + "/" + JsonServlet.encode(dirName)));
                    }
                    else {
                        String fileId = fileId(element);
                        String fileName = fileName(element);
                        String fileTag = fileTag(client, context, fileId);

                        if (fileTag != null) {
                            map.put(path + "/" + JsonServlet.encode(fileName), fileTag);
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
        CLIENT.set("vu");
        Map<String, String> tags = cloud.listTags("Mathematik");
        System.out.println("tags = " + tags);
        //CLIENT.set("test");
        //cloud.transferTags(tags);
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

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

    public class HttpCopy extends HttpRequestBase {

        final static String METHOD_NAME = "COPY";

        public HttpCopy(final String from, final String to) {
            super();
            setURI(URI.create(from));
            setHeader("Destination", to);
            setHeader("Overwrite", "T");
        }

        @Override
        public String getMethod() {
            return METHOD_NAME;
        }
    }

    static class Attachment {
        String id;
        String name;
        String tag = null;
        String type;
        Integer size;

        public Attachment(String fileId, String fileName, String fileType, Integer fileSize) {
            id = fileId;
            name = fileName;
            type = fileType;
            size = fileSize;
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

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            Attachment that = (Attachment) o;
            return name.equals(that.name);
        }

        @Override
        public int hashCode() {
            return Objects.hash(name);
        }
    }

    static class AttachmentInputStream {
        public AttachmentInputStream(InputStream stream, String fileName, String mimeType, long contentLength) {
            this.stream = stream;
            this.fileName = fileName;
            this.mimeType = mimeType;
            this.contentLength = contentLength;
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
    }
}
