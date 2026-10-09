
const left = document.getElementById("left");
const right = document.getElementById("right");
let busy = false;
let lastDirection = "left_to_right";

function options() {
  const quote = document.querySelector(".quote.active").dataset.q;
  return {
    delimiter: document.getElementById("delimiter").value,
    itemPrefix: document.getElementById("itemPrefix").value,
    itemSuffix: document.getElementById("itemSuffix").value,
    listPrefix: document.getElementById("listPrefix").value,
    listSuffix: document.getElementById("listSuffix").value,
    quote,
    lowercase: document.getElementById("lowercase").checked,
    reverse: document.getElementById("reverse").checked,
    remove_line_breaks: document.getElementById("removeLineBreaks").checked,
    remove_paragraph_breaks: document.getElementById("removeParagraphBreaks").checked,
    remove_extra_spaces: document.getElementById("removeExtraSpaces").checked,
    remove_all_whitespace: document.getElementById("removeWhitespace").checked,
    remove_duplicates: document.getElementById("removeDuplicates").checked
  };
}

function linesFor(text) {
  const n = Math.max(1, text.split(/\n/).length);
  return Array.from({length:n}, (_,i)=>i+1).join("\n");
}
function updateGutters() {
  document.getElementById("leftNumbers").textContent = linesFor(left.value);
  document.getElementById("rightNumbers").textContent = linesFor(right.value);
  document.getElementById("leftCount").textContent =
    left.value ? `${left.value.split(/\n/).filter(x=>x.trim()!=="").length} lines` : "0 lines";
  document.getElementById("rightCount").textContent =
    right.value ? `${right.value.split(options().delimiter === "\\n" ? "\\n" : options().delimiter).filter(x=>x.trim()!=="").length} items` : "0 items";
}
function applyPrefixSuffix(values) {
  const o = options();
  return values.map(v => `${o.itemPrefix}${v}${o.itemSuffix}`);
}

async function convert(direction) {
  if (busy) return;
  busy = true;
  const o = options();
  let source = direction === "left_to_right" ? left.value : right.value;

  let values;
  if (direction === "left_to_right") {
    values = source.split(/\r?\n/);
    values = clean(values, o);
    values = applyPrefixSuffix(values);
    if (o.quote) values = values.map(v => `${o.quote}${v}${o.quote}`);
    let result = values.join(o.delimiter === "\\n" ? "\n" : o.delimiter);
    result = `${o.listPrefix}${result}${o.listSuffix}`;
    right.value = result;
  } else {
    let s = source;
    if (o.listPrefix && s.startsWith(o.listPrefix)) s = s.slice(o.listPrefix.length);
    if (o.listSuffix && s.endsWith(o.listSuffix)) s = s.slice(0, -o.listSuffix.length);
    const delim = o.delimiter === "\\t" ? "\t" : o.delimiter === "\\n" ? "\n" : o.delimiter;
    values = s.split(delim);
    values = clean(values, o).map(v => removeQuotesAndWrappers(v, o));
    left.value = values.join("\n");
  }
  updateGutters();
  busy = false;
}

function removeQuotesAndWrappers(v, o) {
  let x = v.trim();
  if (o.itemPrefix && x.startsWith(o.itemPrefix)) x = x.slice(o.itemPrefix.length);
  if (o.itemSuffix && x.endsWith(o.itemSuffix)) x = x.slice(0, -o.itemSuffix.length);
  if (o.quote && x.startsWith(o.quote) && x.endsWith(o.quote)) x = x.slice(1,-1);
  return x;
}
function clean(values, o) {
  let out = values.map(v => v.trim());
  if (o.remove_line_breaks) out = out.map(v => v.replace(/[\r\n]/g, ""));
  if (o.remove_paragraph_breaks) out = out.map(v => v.replace(/\n{2,}/g, "\n"));
  if (o.remove_extra_spaces) out = out.map(v => v.replace(/\s+/g, " "));
  if (o.remove_all_whitespace) out = out.map(v => v.replace(/\s/g, ""));
  out = out.filter(v => v !== "");
  if (o.remove_duplicates) out = [...new Set(out)];
  if (o.lowercase) out = out.map(v => v.toLowerCase());
  if (o.reverse) out.reverse();
  return out;
}

left.addEventListener("input", () => convert("left_to_right"));
right.addEventListener("input", () => convert("right_to_left"));

document.querySelectorAll("select, input").forEach(el => {
  el.addEventListener("input", () => {
    if (document.activeElement === right) convert("right_to_left");
    else convert("left_to_right");
  });
});
document.querySelectorAll(".quote").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".quote").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    convert("left_to_right");
  });
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  const text = right.value;

  try {
    // Modern Clipboard API works in HTTPS/localhost.
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // Fallback for HTTP LAN addresses such as:
      // http://192.168.10.94:5000
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.style.position = "fixed";
      helper.style.left = "-9999px";
      helper.style.top = "0";
      document.body.appendChild(helper);
      helper.focus();
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }

    const msg = document.getElementById("copied");
    msg.textContent = "Copied!";
    msg.style.display = "inline";
    setTimeout(() => msg.style.display = "none", 1200);
  } catch (err) {
    const msg = document.getElementById("copied");
    msg.textContent = "Copy failed - select and copy manually";
    msg.style.display = "inline";
    setTimeout(() => msg.style.display = "none", 2200);
  }
});

document.getElementById("resetBtn").addEventListener("click", () => {
  left.value = ""; right.value = "";
  document.getElementById("delimiter").value = ",";
  document.getElementById("itemPrefix").value = "";
  document.getElementById("itemSuffix").value = "";
  document.getElementById("listPrefix").value = "";
  document.getElementById("listSuffix").value = "";
  document.querySelectorAll(".quote").forEach(b => b.classList.remove("active"));
  document.querySelector('.quote[data-q=""]').classList.add("active");
  document.querySelectorAll(".checks input").forEach(x => x.checked = false);
  document.getElementById("removeLineBreaks").checked = true;
  document.getElementById("removeParagraphBreaks").checked = true;
  updateGutters();
});

document.getElementById("saveBtn").addEventListener("click", () => {
  // Save exactly what is currently displayed in the OUTPUT box.
  const output = right.value;
  const blob = new Blob([output], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "converted_output.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

[left,right].forEach(t => t.addEventListener("scroll", () => {
  document.getElementById(t === left ? "leftNumbers" : "rightNumbers").scrollTop = t.scrollTop;
}));
updateGutters();
