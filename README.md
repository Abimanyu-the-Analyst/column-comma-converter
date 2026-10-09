
# Column Comma Converter

A lightweight Flask web application inspired by the column-to-comma converter UI shown in the reference image.

## Features

- Column → delimited list conversion
- Delimited list → column conversion
- Live conversion as you type/paste
- Custom delimiter
- Item/list prefix and suffix
- None / double / single quotes
- Lowercase
- Reverse
- Remove line breaks
- Remove paragraph breaks
- Remove extra spaces
- Remove all whitespace
- Remove duplicates
- Copy output
- Save CSV
- Responsive layout

## Run on Windows

```powershell
cd column_comma_converter
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Open http://127.0.0.1:5000

## Run on Linux/macOS

```bash
cd column_comma_converter
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```


## Bug fixes

- Added a copy fallback for HTTP LAN access such as `http://192.168.10.94:5000`.
- Save CSV now exports the current right-side converted output instead of the left-side input.
