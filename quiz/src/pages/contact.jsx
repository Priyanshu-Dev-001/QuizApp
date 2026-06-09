import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  MessageCircle,
  Globe,
} from "lucide-react";

import "./contact.css";

export default function Contact() {
  return (
    <div className="contact-page">
      <div className="contact-bg"></div>

      <section className="contact-hero">

        {/* LEFT SIDE */}
        <div className="contact-left">

          <p className="contact-tag">
            QUIZAPP SUPPORT
          </p>

          <h1>
            Let's build smarter
            <span> learning together.</span>
          </h1>

          <p className="contact-text">
            Have questions, feedback, or need help with your quizzes?
            Our support team is always ready to help students and teachers.
          </p>

          <div className="contact-cards">

            <div className="info-card">
              <div className="info-icon">
                <Phone size={22} />
              </div>

              <div>
                <h3>Call Us</h3>
                <span>+91 98765 43210</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <Mail size={22} />
              </div>

              <div>
                <h3>Email</h3>
                <span>support@quizapp.com</span>
              </div>
            </div>

            <div className="info-card">
              <div className="info-icon">
                <MapPin size={22} />
              </div>

              <div>
                <h3>Location</h3>
                <span>Dehradun, Uttarakhand</span>
              </div>
            </div>

          </div>

          {/* SOCIAL BUTTONS */}
          <div className="social-links">

            <button type="button">
              IG
            </button>

            <button type="button">
              FB
            </button>

            <button type="button">
              TW
            </button>

            <button type="button">
              IN
            </button>

          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="contact-right">

          <div className="form-shell">

            <div className="form-top">
              <p>GET IN TOUCH</p>
              <h2>Send us a message</h2>
            </div>

            <form className="contact-form">

              <div className="input-grid">

                <label>
                  Full Name

                  <input
                    type="text"
                    placeholder="Enter your full name"
                  />
                </label>

                <label>
                  Email Address

                  <input
                    type="email"
                    placeholder="Enter your email"
                  />
                </label>

              </div>

              <div className="input-grid">

                <label>
                  Phone Number

                  <input
                    type="text"
                    placeholder="Enter phone number"
                  />
                </label>

                <label>
                  Subject

                  <input
                    type="text"
                    placeholder="Subject"
                  />
                </label>

              </div>

              <label>
                Message

                <textarea
                  rows="6"
                  placeholder="Write your message here..."
                ></textarea>
              </label>

              <button className="send-btn" type="submit">
                <Send size={18} />
                Send Message
              </button>

            </form>

          </div>

        </div>

      </section>

      {/* EXTRA SECTION */}
      <section className="contact-extra">

        <div className="extra-card">

          <div className="extra-icon">
            <Clock size={28} />
          </div>

          <h3>Working Hours</h3>

          <p>
            Monday - Saturday
          </p>

          <span>
            9:00 AM - 8:00 PM
          </span>

        </div>

        <div className="extra-card">

          <div className="extra-icon">
            <MessageCircle size={28} />
          </div>

          <h3>Live Chat</h3>

          <p>
            Quick response from our support team.
          </p>

          <span>
            Available 24/7
          </span>

        </div>

        <div className="extra-card">

          <div className="extra-icon">
            <Globe size={28} />
          </div>

          <h3>Global Access</h3>

          <p>
            Students and teachers from everywhere.
          </p>

          <span>
            Worldwide platform
          </span>

        </div>

      </section>

    </div>
  );
}
