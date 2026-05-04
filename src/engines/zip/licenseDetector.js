/**
 * Wave AI — ZIP Analysis — License Detector
 */
export const LICENSE_SIGNATURES = {
  MIT: { keywords: ["permission is hereby granted", "mit license", "mit licence"], permissive: true, commercial: true },
  Apache2: { keywords: ["apache license, version 2.0", "apache-2.0", "www.apache.org/licenses/license-2.0"], permissive: true, commercial: true },
  GPL3: { keywords: ["gnu general public license", "version 3", "gplv3"], permissive: false, commercial: false, copyleft: true },
  GPL2: { keywords: ["gnu general public license", "version 2", "gplv2"], permissive: false, commercial: false, copyleft: true },
  BSD2: { keywords: ["redistribution and use in source and binary forms", "2-clause"], permissive: true, commercial: true },
  BSD3: { keywords: ["neither the name of", "3-clause", "bsd 3-clause"], permissive: true, commercial: true },
  ISC: { keywords: ["isc license", "permission to use, copy, modify"], permissive: true, commercial: true },
  LGPL: { keywords: ["lesser general public license", "lgpl"], permissive: false, commercial: true, copyleft: "weak" },
  CC0: { keywords: ["creative commons", "cc0", "no copyright"], permissive: true, commercial: true },
  UNLICENSED: { keywords: ["unlicensed", "all rights reserved", "proprietary"], permissive: false, commercial: false },
};

export function detectLicense(textFiles) {
  const licenseFile = textFiles.find(f => /^license/i.test(f.name));
  if (!licenseFile) {
    const pkgJson = textFiles.find(f => f.name === "package.json");
    if (pkgJson) { try { const pkg = JSON.parse(pkgJson.content); if (pkg.license) return { license: pkg.license, source: "package.json", confidence: 0.9 }; } catch {} }
    return { license: "Unknown", confidence: 0, note: "No LICENSE file found" };
  }
  const content = licenseFile.content.toLowerCase();
  for (const [name, sig] of Object.entries(LICENSE_SIGNATURES)) {
    const matches = sig.keywords.filter(k => content.includes(k));
    if (matches.length >= 1) return { license: name, source: licenseFile.name, confidence: Math.min(1, matches.length / sig.keywords.length + 0.5), permissive: sig.permissive, commercial: sig.commercial, copyleft: sig.copyleft || false };
  }
  return { license: "Custom/Unknown", source: licenseFile.name, confidence: 0.3, note: "License file found but not recognized" };
}

export function getLicenseCompatibility(license1, license2) {
  const permissive = ["MIT", "Apache2", "BSD2", "BSD3", "ISC", "CC0"];
  if (permissive.includes(license1) && permissive.includes(license2)) return { compatible: true, note: "Both permissive licenses — generally compatible" };
  if (license1.includes("GPL") || license2.includes("GPL")) return { compatible: false, note: "GPL requires derivative works to be GPL — check copyleft requirements" };
  return { compatible: null, note: "Check specific license terms for compatibility" };
}
