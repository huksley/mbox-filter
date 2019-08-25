const Mbox = require("node-mbox");
const MailParser = require('mailparser').MailParser;
const CsvWriter = require('csv-stringify')

let columns = {
  ID: 'id',
  Date: 'Date',
  From: "From",
  To: "To",
  Subject: "Subject",
  Labels: "Labels"
};

const mbox = new Mbox({ streaming: true });

const csv = CsvWriter({
  delimiter: ';',
  columns,
  header: true,
  quoted_empty: true,
})

csv.pipe(process.stdout)

const isnulla = (v, def) => (v === undefined || v === null || v.value === undefined ? def : v)
const noaddr = { value: [ { address: "" } ] }

mbox.on("message", function(stream) {
  let mailparser = new MailParser({ streamAttachments : true });
  mailparser.on('headers', function(headers) {
    const id = headers.get('message-id');
    try {
      const id = headers.get('message-id');
      const date = headers.get('date');
      const from = isnulla(headers.get('from'), noaddr).value.map(v => v.address).join(", ")
      const to = isnulla(headers.get('to'), noaddr).value.map(v => v.address).join(", ")
      const subject = (headers.get('subject') || "").trim();
      const labels = headers.get('x-gmail-labels')
      csv.write([ id, date, from, to, subject, labels])
    } catch (e) {
      console.warn("Failed to write msg " + id + ": " + e.message, e);
    }
  });
  mailparser.write(stream);
  mailparser.end();
});

process.stdin.pipe(mbox);