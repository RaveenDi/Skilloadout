// License detection. Only content under a license that permits redistribution is mirrored;
// everything else is listed as metadata + a link to the original.

export const REDISTRIBUTABLE = new Set([
  "MIT",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "0BSD",
  "CC0-1.0",
  "CC-BY-4.0",
  "CC-BY-SA-4.0",
  "MPL-2.0",
  "Unlicense",
  "GPL-2.0",
  "GPL-3.0",
  "LGPL-3.0",
  "AGPL-3.0",
]);

export function detectLicenseText(text) {
  const s = String(text).slice(0, 4000);
  if (/Apache License[\s\S]{0,120}Version 2\.0/i.test(s)) return "Apache-2.0";
  if (/Permission is hereby granted, free of charge/i.test(s)) return "MIT";
  if (/Mozilla Public License[\s\S]{0,60}2\.0/i.test(s)) return "MPL-2.0";
  if (/Attribution-ShareAlike 4\.0/i.test(s)) return "CC-BY-SA-4.0";
  if (/Attribution 4\.0 International/i.test(s)) return "CC-BY-4.0";
  if (/\bCC0\b|Creative Commons Zero|CC0 1\.0 Universal/i.test(s)) return "CC0-1.0";
  if (/This is free and unencumbered software/i.test(s)) return "Unlicense";
  if (/Redistribution and use in source and binary forms/i.test(s))
    return /Neither the name/i.test(s) ? "BSD-3-Clause" : "BSD-2-Clause";
  if (/Permission to use, copy, modify, and\/or distribute this software for any/i.test(s)) return "ISC";
  if (/GNU AFFERO GENERAL PUBLIC LICENSE/i.test(s)) return "AGPL-3.0";
  if (/GNU LESSER GENERAL PUBLIC LICENSE/i.test(s)) return "LGPL-3.0";
  if (/GNU GENERAL PUBLIC LICENSE/i.test(s)) return /Version 3/i.test(s) ? "GPL-3.0" : "GPL-2.0";
  if (/all rights reserved|proprietary|may not (use|copy|distribute)/i.test(s)) return "Proprietary";
  return "Unknown";
}

// Normalize a free-form `license:` value (frontmatter, API spdx id) to an SPDX-ish id.
// Returns null when the value just points elsewhere ("see LICENSE.txt").
export function normalizeLicense(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (!v || /^(none|null|noassertion|other)$/i.test(v)) return null;
  if (/^(see )?licen[cs]e(\.(txt|md))?( file)?$/i.test(v)) return null; // pointer to the LICENSE file
  if (/see |complete terms|license\.(txt|md)/i.test(v)) {
    if (/proprietary/i.test(v)) return "Proprietary";
    return null;
  }
  const map = [
    [/^mit\b/i, "MIT"],
    [/apache[\s,-]*(license[\s,-]*)?(v(ersion)?[\s.]*)?2/i, "Apache-2.0"],
    [/(^bsd[\s-]*3)|(3[\s-]*clause[\s-]*bsd)/i, "BSD-3-Clause"],
    [/(^bsd[\s-]*2)|(2[\s-]*clause[\s-]*bsd)/i, "BSD-2-Clause"],
    [/^bsd( license)?$/i, "BSD-3-Clause"],
    [/^isc$/i, "ISC"],
    [/^0bsd$/i, "0BSD"],
    [/cc0/i, "CC0-1.0"],
    [/cc[\s-]*by[\s-]*sa[\s-]*4/i, "CC-BY-SA-4.0"],
    [/cc[\s-]*by[\s-]*4/i, "CC-BY-4.0"],
    [/mpl[\s-]*2/i, "MPL-2.0"],
    [/unlicense/i, "Unlicense"],
    [/agpl/i, "AGPL-3.0"],
    [/lgpl/i, "LGPL-3.0"],
    [/gpl[\s-]*(v)?3/i, "GPL-3.0"],
    [/gpl[\s-]*(v)?2/i, "GPL-2.0"],
    [/proprietary|all rights reserved/i, "Proprietary"],
  ];
  for (const [re, id] of map) if (re.test(v)) return id;
  return v.length <= 40 ? v : "Unknown";
}

export const isRedistributable = (id) => REDISTRIBUTABLE.has(id);
