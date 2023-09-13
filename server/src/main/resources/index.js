function convert(docel) {
    if ('_' === docel.topic) return;
    index("chapter", docel.chapter, {'store': true});
    index("topic", docel.topic, {'store': true, 'boost': 2});
    if (docel.summary)
        index("summary", docel.summary, {'store': true, 'boost': 2});
    if (docel.description)
        index("description", docel.description, {'store': true});
    if (docel.thumb)
        index("thumb", docel.thumb, {'store': true, 'index': false});
}