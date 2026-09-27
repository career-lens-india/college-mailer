import { renderEmailHtml } from "../src/templates/renderEmail.tsx";
import type { EmailTemplateData, TemplateId } from "../src/types/outreach.ts";

const templates: TemplateId[] = ["professional", "modern", "minimal", "newsletter"];

const full: EmailTemplateData = {
  recipientName: "Dr. Ravi Kumar",
  designation: "Dean",
  collegeName: "Sai Vidya Institute of Technology",
  department: "CSE & ISE",
  sessionInterest: "Hands-on Workshop",
};

const faculty: EmailTemplateData = {
  recipientName: "Dr. Ravi Kumar",
  collegeName: "Sai Vidya Institute of Technology",
  department: "MCA",
  sessionInterest: "Faculty Development",
};

const fallback: EmailTemplateData = {
  collegeName: "Sai Vidya Institute of Technology",
  department: "ISE",
  sessionInterest: "Not Specified",
};

const failures: string[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) failures.push(message);
}

for (const id of templates) {
  const html = renderEmailHtml(id, full);
  assert(html.startsWith("<!DOCTYPE html><html"), `${id} missing document`);
  assert(!html.includes("{{"), `${id} leaked a template token`);
  assert(!html.includes("<script"), `${id} contains script`);
  assert(!html.includes("Not Specified"), `${id} inserted Not Specified`);
  assert(html.includes("Dear Dr. Ravi Kumar,"), `${id} missing recipient name`);
  assert(html.includes("Dean"), `${id} missing designation`);
  assert(html.includes("Sai Vidya Institute of Technology"), `${id} missing college`);
  assert(html.includes("CSE &amp; ISE") || html.includes("CSE & ISE"), `${id} missing department`);
  assert(html.includes("a hands-on workshop"), `${id} missing session interest`);
  assert(html.includes("/assets/careerlens-logo.png"), `${id} missing logo url`);
  assert(html.includes("/assets/careerlens-banner.jpg"), `${id} missing banner url`);
  assert(html.includes("alt=\"CareerLens India\""), `${id} missing logo alt`);
  assert(html.includes("https://www.career-lens.in/campus-impact"), `${id} missing campus link`);
  assert(html.includes("+91 63619 10673"), `${id} missing phone`);
  assert(html.includes("@media only screen and (max-width: 620px)"), `${id} missing mobile css`);
  assert(!html.includes("C:\\"), `${id} contains a filesystem path`);
}

const bare = renderEmailHtml("professional", fallback);
assert(bare.includes("Dear Sir/Madam,"), "fallback greeting missing");
assert(!bare.includes("Dean"), "empty designation was rendered");
assert(!bare.includes("Not Specified"), "Not Specified leaked into fallback");
assert(bare.includes("an industry interaction"), "unspecified session was not generalized");
assert(bare.includes("the ISE department"), "singular department phrase missing");

const facultyHtml = renderEmailHtml("modern", faculty);
assert(facultyHtml.includes("faculty from the MCA department"), "faculty audience missing");
assert(!facultyHtml.includes("students from the MCA"), "faculty session still says students");

const minimal = renderEmailHtml("minimal", full);
assert(minimal.includes("What we offer"), "minimal offer section missing");
assert(minimal.includes("Industry × Academia") || minimal.includes("Industry &#215; Academia"), "minimal descriptor missing");

const modern = renderEmailHtml("modern", full);
assert(modern.includes("Bring Industry Experience Into the Classroom"), "modern headline missing");

const newsletter = renderEmailHtml("newsletter", full);
assert(newsletter.includes("Why CareerLens"), "newsletter why section missing");
assert(newsletter.includes("60–90 min") || newsletter.includes("60–90"), "newsletter formats missing");
assert(newsletter.includes("Software Development"), "newsletter missing a core area");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("All template checks passed.");
