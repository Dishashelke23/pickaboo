"use client";

import { useRouter } from "next/navigation";

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-10 scroll-mt-24 first:mt-0">
      <h2 className="font-[family-name:var(--font-display)] text-xl text-ink sm:text-2xl">
        {title}
      </h2>
      <div className="mt-3 space-y-3 font-[family-name:var(--font-body)] text-sm leading-relaxed text-ink/80 sm:text-base">
        {children}
      </div>
    </section>
  );
}

export default function LegalPage() {
  const router = useRouter();
  const lastUpdated = "August 13, 2026";

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12 sm:py-16">
      <button
        onClick={() => router.push("/")}
        className="font-[family-name:var(--font-mono)] text-xs text-ink/60 hover:text-curtain sm:text-sm"
      >
        ← back to Pickaboo
      </button>

      <div className="mt-6">
        <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-curtain">
          legal
        </span>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-ink sm:text-4xl">
          Privacy Policy &amp; Terms of Use
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-ink/50">
          Last updated: {lastUpdated}
        </p>
      </div>

      <div className="mt-8 rounded-2xl bg-white/60 p-5 ring-1 ring-ink/10">
        <p className="font-[family-name:var(--font-body)] text-sm text-ink/80">
          Pickaboo is a browser-based photobooth. The short version: your
          camera feed and photos are processed entirely on your own device.
          We don&apos;t have a server that stores your photos, we don&apos;t
          require an account, and we don&apos;t track you across the web.
          The full details are below.
        </p>
      </div>

      <nav className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-y border-ink/10 py-4 font-[family-name:var(--font-mono)] text-xs text-ink/60">
        <a href="#privacy" className="hover:text-curtain">Privacy Policy</a>
        <a href="#photos" className="hover:text-curtain">Your Photos</a>
        <a href="#storage" className="hover:text-curtain">Local Storage</a>
        <a href="#thirdparty" className="hover:text-curtain">Third-Party Services</a>
        <a href="#children" className="hover:text-curtain">Children&apos;s Privacy</a>
        <a href="#terms" className="hover:text-curtain">Terms of Use</a>
        <a href="#liability" className="hover:text-curtain">Disclaimer &amp; Liability</a>
        <a href="#contact" className="hover:text-curtain">Contact</a>
      </nav>

      <Section id="privacy" title="1. Privacy Policy : Overview">
        <p>
          This Privacy Policy explains what happens to your information when
          you use Pickaboo (&quot;the Service&quot;, &quot;we&quot;,
          &quot;us&quot;). By using Pickaboo, you agree to the practices
          described here.
        </p>
        <p>
          Pickaboo does not have user accounts, does not require you to sign
          up, and does not collect names, email addresses, or any personal
          identifiers to let you use the core photobooth features.
        </p>
      </Section>

      <Section id="photos" title="2. Your Camera Feed and Photos">
        <p>
          <strong>Camera access.</strong> Pickaboo requests permission to use
          your device&apos;s camera solely so you can see a live preview and
          take photos. This request goes through your browser&apos;s own
          permission system, we never gain camera access without your
          explicit, browser-level consent, and you can revoke that
          permission at any time through your browser or device settings.
        </p>
        <p>
          <strong>Where your photos go.</strong> Every photo you take, every
          filter applied, and every sticker or text you add is processed
          entirely inside your own browser, on your own device. Pickaboo has
          no backend server that receives, stores, views, or has any access
          to your camera feed or your finished photos. When you tap
          &quot;Download,&quot; the image or GIF file is generated on your
          device and saved directly to your device, it never passes through
          any server we operate or control.
        </p>
        <p>
          <strong>Face detection.</strong> Certain filters (like the Hearts
          layout) use on-device face-detection technology to position
          effects on your face. This detection runs entirely in your
          browser using models loaded once and cached locally; no image,
          video frame, or face data is ever transmitted anywhere for this
          purpose.
        </p>
        <p>
          <strong>Uploaded photos.</strong> If you use the &quot;Upload&quot;
          option to add existing photos instead of using your camera, those
          files are likewise processed only in your browser and are never
          transmitted to a server.
        </p>
      </Section>

      <Section id="storage" title="3. Local Storage and Cookies">
        <p>
          Pickaboo uses your browser&apos;s built-in <em>session storage</em>{" "}
          to temporarily pass your captured photos and preferences between
          steps of the app (for example, from the camera screen to the
          customization screen) during a single visit. This data:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Stays entirely on your device and is never sent to us.</li>
          <li>Is automatically cleared when you close the browser tab.</li>
          <li>Is not used for tracking, advertising, or analytics.</li>
        </ul>
        <p>
          Pickaboo does not currently use tracking cookies or third-party
          advertising cookies.
        </p>
      </Section>

      <Section id="thirdparty" title="4. Third-Party Services">
        <p>
          To function, Pickaboo&apos;s pages load a small number of
          resources from third-party content-delivery networks (for example,
          font files and the GIF-encoding helper script). These are static
          files (not tracking scripts), and connecting to them may expose
          your IP address to those providers in the same way any website
          request does. We do not control these providers&apos; own privacy
          practices and encourage you to review them if you have concerns.
        </p>
        <p>
          If Pickaboo is hosted on a platform such as Vercel, that host may
          keep standard server access logs (e.g., IP address, browser type,
          request timestamps) for security and reliability purposes,
          consistent with the hosting provider&apos;s own privacy policy.
          These logs are not used by us to identify individual users or
          their photos.
        </p>
      </Section>

      <Section id="children" title="5. Children's Privacy">
        <p>
          Pickaboo is not directed at children under the age of 13, and we
          do not knowingly collect personal information from children. Since
          the Service does not collect personal information from any user in
          the first place, no such data is retained for anyone, including
          minors. If you believe a child has used the Service in a way that
          concerns you, please contact us using the information below.
        </p>
      </Section>

      <Section id="rights" title="6. Your Rights and Choices">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            You can deny or revoke camera permission at any time via your
            browser settings, the Service simply won&apos;t be able to show
            a live preview or take live photos without it (you can still use
            the Upload option).
          </li>
          <li>
            Because we do not store your photos or personal data on any
            server, there is nothing on our end to request, correct, or
            delete, your copies live only on your own device once
            downloaded.
          </li>
          <li>
            Clearing your browser&apos;s site data for Pickaboo will remove
            any temporary session data described in Section 3.
          </li>
        </ul>
      </Section>

      <Section id="security" title="7. Data Security">
        <p>
          Because your photos and camera data never leave your device during
          normal use of the Service, the primary security consideration is
          your own device and browser. We recommend keeping your browser
          up to date and only granting camera permissions to sites you
          trust.
        </p>
      </Section>

      <Section id="terms" title="8. Terms of Use">
        <p>
          By accessing or using Pickaboo, you agree to these Terms of Use.
          If you do not agree, please do not use the Service.
        </p>
        <p>
          <strong>Eligibility.</strong> You must be at least 13 years old to
          use Pickaboo, or have the consent and supervision of a parent or
          legal guardian if you are younger, consistent with applicable law
          in your region.
        </p>
        <p>
          <strong>Acceptable use.</strong> You agree not to use Pickaboo to
          capture, create, or share content that is illegal, harassing,
          defamatory, or that violates the privacy or rights of others. You
          are solely responsible for obtaining the consent of anyone else
          appearing in photos you take, and for how you use, store, or share
          the images and GIFs you create.
        </p>
        <p>
          <strong>Your content.</strong> You retain full ownership of any
          photos, GIFs, or creations you make using Pickaboo. We claim no
          rights to your content, and as described above, we never
          receive a copy of it in the first place.
        </p>
        <p>
          <strong>Our content.</strong> The Pickaboo name, design, and
          underlying code are provided for your use of the Service and are
          not licensed to you for redistribution or resale as your own
          product.
        </p>
      </Section>

      <Section id="liability" title="9. Disclaimer of Warranties and Limitation of Liability">
        <p>
          Pickaboo is provided &quot;as is&quot; and &quot;as available,&quot;
          without warranties of any kind, whether express or implied,
          including but not limited to warranties of merchantability,
          fitness for a particular purpose, or non-infringement. We do not
          warrant that the Service will be uninterrupted, error-free, or
          that any filter, detection feature, or export will function
          perfectly on every device or browser.
        </p>
        <p>
          To the fullest extent permitted by applicable law, Pickaboo and
          its creator(s) shall not be liable for any indirect, incidental,
          special, consequential, or punitive damages, or any loss of data,
          arising out of or related to your use of, or inability to use,
          the Service.
        </p>
        <p>
          You agree to use the Service at your own discretion and risk, and
          are solely responsible for any content you create and how you
          choose to use it.
        </p>
      </Section>

      <Section id="changes" title="10. Changes to This Policy">
        <p>
          We may update this Privacy Policy and Terms of Use from time to
          time. Changes will be posted on this page with an updated
          &quot;Last updated&quot; date. Continued use of the Service after
          changes are posted constitutes acceptance of the revised terms.
        </p>
      </Section>

      <Section id="contact" title="11. Contact">
        <p>
          If you have questions about this Privacy Policy or these Terms of
          Use, you can reach us at{" "}
          <span className="font-medium text-curtain">
            [add your contact email here]
          </span>
          .
        </p>
      </Section>

      <p className="mt-12 border-t border-ink/10 pt-6 font-[family-name:var(--font-mono)] text-[10px] text-ink/40">
        This page is provided for general informational purposes and does
        not constitute legal advice.
      </p>
    </main>
  );
}