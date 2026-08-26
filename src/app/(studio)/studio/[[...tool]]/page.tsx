export default function StudioPage() {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
    process.env.NEXT_PUBLIC_SANITY_DATASET,
  );
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0F3040",
        color: "#f3eee7",
        fontFamily: "system-ui",
        padding: 32,
      }}
    >
      <div style={{ maxWidth: 680 }}>
        <p
          style={{
            letterSpacing: ".16em",
            textTransform: "uppercase",
            fontSize: 12,
            color: "#D99B7F",
          }}
        >
          AX7MOV Studio
        </p>
        <h1 style={{ fontSize: 48, lineHeight: 1.05 }}>
          {configured
            ? "The linked content studio is ready to run."
            : "Connect a Sanity project, then run the linked studio."}
        </h1>
        <p style={{ lineHeight: 1.7, opacity: 0.8 }}>
          {configured
            ? "From the web directory, run npm run studio and open the local URL printed by Sanity."
            : "Add NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET to .env.local. The public portfolio continues to use local fallback content until then."}
        </p>
        <p style={{ lineHeight: 1.7, opacity: 0.62 }}>
          The authoring packages are development-only, keeping the public Vercel
          runtime smaller and isolated from Studio tooling.
        </p>
      </div>
    </main>
  );
}
