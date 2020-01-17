package kmap;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Properties;

public class JsonServlet extends HttpServlet {
    //protected final String cors_url = "http://localhost:8080";
    protected Properties properties;
    protected Authentication authentication;

    @Override
    public void init() throws ServletException {
        super.init();
        try {
            properties = new Properties();
            properties.load(getServletContext().getResourceAsStream("/kmap.properties"));
            getServletContext().setAttribute("properties", properties);
            authentication = new Authentication(properties);
        }
        catch (IOException e) {
            throw new ServletException(e);
        }
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse resp) {
        corsHeaders(request, resp);
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

    static protected void writeResponse(HttpServletRequest request, HttpServletResponse resp, JsonElement object) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("utf-8");
        corsHeaders(request, resp);
        resp.getWriter().print(object.toString());
    }

    static void sendError(HttpServletRequest req, HttpServletResponse resp, Exception e) {
        corsHeaders(req, resp);
        resp.setStatus(500);
        resp.setContentType("text/plain");
        resp.setCharacterEncoding("utf-8");
        try {
            resp.getWriter().print(e.getMessage());
        }
        catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    static void sendError(HttpServletRequest req, HttpServletResponse resp, int status, String message) {
        corsHeaders(req, resp);
        resp.setStatus(status);
        resp.setContentType("text/plain");
        resp.setCharacterEncoding("utf-8");
        try {
            resp.getWriter().print(message);
        }
        catch (IOException ex) {
            ex.printStackTrace();
        }
    }

    static void corsHeaders(HttpServletRequest request, HttpServletResponse resp) {
        Properties properties = (Properties)request.getServletContext().getAttribute("properties");
        if (Boolean.parseBoolean(properties.getProperty("kmap.cors"))) {
            String referer = getHeader(request, "referer");
            if (referer == null)
                throw new RuntimeException("referer header missing");

            int i = referer.indexOf("/", 9);
            if (i != -1)
                referer = referer.substring(0, i);

            System.out.println(referer);

            resp.setHeader("Access-Control-Allow-Origin", referer);
            resp.setHeader("Access-Control-Allow-Credentials", "true");
            resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD, PUT, POST");
            resp.setHeader("Access-Control-Allow-Headers", "Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, X-Instance");
        }
    }

    String extractClient(HttpServletRequest request) {
        String client;

        if ((client = request.getParameter("instance")) != null) {
            System.out.println("instance from parameter = " + client);
            return client;
        }

        if ((client = getHeader(request, "X-Instance")) != null) {
            System.out.println("instance from header = " + client);
            return client;
        }

        if ((client = getHeader(request, "referer")) != null && client.length() != 0) {
            int start = client.indexOf("/", 9);
            int end = client.indexOf("/", start + 1);
            if (end != -1) {
                client = client.substring(start + 1, end);
                System.out.println("instance from referer = " + client);
            }
        }

        System.out.println("instance not specified = lala");
        return "lala";
    }

    private static String getHeader(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value != null && value.length() != 0 ? value : null;
    }
}
