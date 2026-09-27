export const FONT = "Arial, Helvetica, sans-serif";
export const SERIF = "Georgia, 'Times New Roman', serif";

export const NAVY = "#0c2340";
export const INK = "#1c2838";
export const MUTED = "#5c6b7c";
export const TEAL = "#0e7c84";
export const TEAL_DEEP = "#0a5c63";
export const ORANGE = "#e8872d";
export const LINE = "#e4ebf2";
export const PAPER = "#f7f5f2";
export const MIST = "#f4f7fb";

export const responsiveCss = `
  body { margin: 0 !important; padding: 0 !important; }
  table { border-collapse: collapse !important; }
  p, h1, h2, td, a, li { overflow-wrap: break-word; word-wrap: break-word; }
  img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; max-width: 100%; }
  @media only screen and (max-width: 620px) {
    .email-container { width: 100% !important; }
    .stack { display: block !important; width: 100% !important; max-width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .h1 { font-size: 26px !important; line-height: 32px !important; }
  }
`;
