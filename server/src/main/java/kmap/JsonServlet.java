package kmap;

import com.google.gson.JsonElement;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Properties;

public class JsonServlet extends HttpServlet {
    protected Properties properties;
    protected Authentication authentication;

    @Override
    public void init() throws ServletException {
        super.init();
        try {
            properties = new Properties();
            properties.load(getServletContext().getResourceAsStream("/kmap.properties"));
            properties.setProperty("context.path", getServletContext().getRealPath("/"));
            getServletContext().setAttribute("properties", properties);
            authentication = new Authentication(properties);
            FirebaseInitializer.init(getServletContext().getResourceAsStream("/serviceAccountKey.json"));
        }
        catch (IOException e) {
            throw new ServletException(e);
        }
    }

    protected String getProperty(String key) {
        String value = properties.getProperty(key);
        if (value == null)
            System.err.println("WARNING: Property " + key + " is not configured");
        return value;
    }

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse resp) {
        newSessionHeader(request, resp);
        corsHeaders(request, resp);
    }

    static protected void writeResponse(HttpServletRequest request, HttpServletResponse resp, JsonElement object) throws IOException {
        newSessionHeader(request, resp);
        corsHeaders(request, resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("utf-8");
        resp.getWriter().print(object.toString());
    }

    static void sendError(HttpServletRequest req, HttpServletResponse resp, Exception e) {
        newSessionHeader(req, resp);
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
        newSessionHeader(req, resp);
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

    static void newSessionHeader(HttpServletRequest request, HttpServletResponse resp) {
        if (request.getSession().isNew()) {
            resp.setHeader("Access-Control-Expose-Headers","X-New-Session");
            resp.setHeader("X-New-Session", "" + request.getSession().getMaxInactiveInterval());
        }
    }

    static void corsHeaders(HttpServletRequest request, HttpServletResponse resp) {
        Properties properties = (Properties)request.getServletContext().getAttribute("properties");
        if (Boolean.parseBoolean(properties.getProperty("kmap.cors"))) {
            String referer = getHeader(request, "referer");
            if (referer != null) {
                int i = referer.indexOf("/", 9);
                if (i != -1)
                    referer = referer.substring(0, i);

                System.out.println(referer);
                resp.setHeader("Access-Control-Allow-Origin", referer);
            }
            resp.setHeader("Access-Control-Allow-Credentials", "true");
            resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS, HEAD, PUT, POST");
            resp.setHeader("Access-Control-Allow-Headers", "Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token, X-Instance");
        }
    }

    String extractClient(HttpServletRequest request) {
        String client;

        if ((client = getHeader(request, "X-Instance")) != null) {
            //System.out.println("instance from header = " + client);
            return client;
        }

        if ((client = getHeader(request, "referer")) != null && client.length() != 0) {
            int start = client.indexOf("/", 9);
            int end = client.indexOf("/", start + 1);
            if (end != -1) {
                client = client.substring(start + 1, end);
                //System.out.println("instance from referer = " + client);
            }
        }

        if ((client = request.getParameter("instance")) != null) {
            //System.out.println("instance from parameter = " + client);
            return client;
        }

        System.out.println("WARNING: instance not specified = root");
        return "root";
    }

    private static String getHeader(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value != null && value.length() != 0 ? value : null;
    }
}
