
from flask import Flask, render_template, request, jsonify, Response
import csv
import io

app = Flask(__name__)

def split_values(text, delimiter=","):
    if not text:
        return []
    if delimiter == "\\n":
        return [x for x in text.splitlines()]
    if delimiter == "\\t":
        return text.split("\t")
    return text.split(delimiter)

def clean_values(values, options):
    out = []
    for value in values:
        value = value.strip()
        if options.get("remove_line_breaks"):
            value = value.replace("\r", "").replace("\n", "")
        if options.get("remove_paragraph_breaks"):
            value = value.replace("\r\n\r\n", "\n").replace("\n\n", "\n")
        if options.get("remove_extra_spaces"):
            value = " ".join(value.split())
        if options.get("remove_all_whitespace"):
            value = "".join(value.split())
        if value or not options.get("remove_line_breaks"):
            out.append(value)
    if options.get("remove_duplicates"):
        seen = set()
        unique = []
        for x in out:
            if x not in seen:
                seen.add(x)
                unique.append(x)
        out = unique
    if options.get("lowercase"):
        out = [x.lower() for x in out]
    if options.get("reverse"):
        out.reverse()
    return out

@app.get("/")
def index():
    return render_template("index.html")

@app.post("/convert")
def convert():
    data = request.get_json(force=True)
    left = data.get("left", "")
    right = data.get("right", "")
    direction = data.get("direction", "left_to_right")
    delimiter = data.get("delimiter", ",")
    options = data.get("options", {})

    if direction == "left_to_right":
        values = clean_values(left.splitlines(), options)
        quote = options.get("quote", "")
        if quote:
            values = [f"{quote}{v}{quote}" for v in values]
        result = delimiter.join(values)
        return jsonify(left=left, right=result, count=len(values))
    else:
        raw = split_values(right, delimiter)
        values = clean_values(raw, options)
        result = "\n".join(values)
        return jsonify(left=result, right=right, count=len(values))

@app.post("/download")
def download():
    data = request.get_json(force=True)
    values = data.get("values", [])
    output = io.StringIO()
    writer = csv.writer(output, lineterminator="\n")
    for value in values:
        writer.writerow([value])
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=converted_list.csv"}
    )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
