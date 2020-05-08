function(doc) {
    if ('_' === doc.topic) return;
    index("chapter", doc.chapter, {'store': true});
    index("topic", doc.topic, {'store': true, 'boost': 2});
    if (doc.summary)
        index("summary", doc.summary, {'store': true, 'boost': 2});
    if (doc.description)
        index("description", doc.description, {'store': true});
    if (doc.thumb)
        index("thumb", doc.thumb, {'store': true, 'index': false});
}