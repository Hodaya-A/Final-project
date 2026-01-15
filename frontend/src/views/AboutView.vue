<template>
  <div class="about-page" dir="rtl">
    <header class="hero-section">
      <div class="hero-content">
        <img src="@/assets/logo-ABOUT.png" alt="Fresh End Logo" class="hero-logo" />

        <h1 class="main-title">הופכים בזבוז להזדמנות.</h1>

        <p class="hero-subtitle">
          פלטפורמה טכנולוגית המגשרת על הפער בין הקמעונאות לצרכן הסופי. אנו מספקים פתרון קצה-לקצה
          המאפשר לעסקים למקסם רווחים ממלאי קיים, ולצרכנים ליהנות ממוצרים איכותיים בעלות מופחתת – הכל
          בממשק אחד חכם.
        </p>

        <div class="hero-badges">
          <span class="hero-badge"> חדשנות טכנולוגית</span>
          <span class="hero-badge"> חיסכון חכם</span>
          <span class="hero-badge"> אימפקט סביבתי</span>
        </div>
      </div>
    </header>

    <div class="main-container">
      <section class="impact-section">
        <h2 class="section-title">המציאות דורשת שינוי</h2>
        <div class="impact-grid">
          <div class="stats-column">
            <div class="stat-card">
              <div class="stat-number">2.5 מיליון טון</div>
              <p class="stat-text">מזון שנזרק בישראל מדי שנה, שחלקו הגדול עדיין ראוי לצריכה.</p>
            </div>
            <div class="stat-card">
              <div class="stat-number">מיליארדי שקלים</div>
              <p class="stat-text">הפסד כלכלי עצום הנגרם מדי שנה עקב בזבוז מזון בשוק הקמעונאי.</p>
            </div>
          </div>
          <div class="graph-column">
            <div class="image-graph-card">
              <div class="graph-header">
                <h3>תמונת מצב: היקף הבזבוז</h3>
                <p>הנתונים שממחישים את הצורך הדחוף בפתרון טכנולוגי.</p>
              </div>
              <div class="image-wrapper-graph">
                <img
                  src="@/assets/waste-graph.svg"
                  alt="גרף נתוני בזבוז מזון"
                  class="uploaded-graph"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="flow-section">
        <h2 class="section-title">הנוסחה שלנו להצלחה</h2>
        <div class="flow-container">
          <div class="flow-step">
            <div class="step-number">1</div>
            <h3>חנויות מפרסמות</h3>
            <p>האלגוריתם שלנו מאפשר לעסקים להעלות מלאי עודף בשניות ולהפוך הפסד לרווח נקי.</p>
          </div>
          <div class="flow-line"></div>
          <div class="flow-step">
            <div class="step-number">2</div>
            <h3>עיבוד ומיון חכם</h3>
            <p>המערכת מנהלת את המלאי ומבצעת התאמה מדויקת (Matching) בין המוצר לצרכן הקרוב ביותר.</p>
          </div>
          <div class="flow-line"></div>
          <div class="flow-step">
            <div class="step-number">3</div>
            <h3>צרכנים מרוויחים</h3>
            <p>
              הצרכנים נהנים ממזון איכותי במחירי רצפה, חוסכים כסף ומצילים את הסביבה בלחיצת כפתור.
            </p>
          </div>
        </div>
      </section>

      <section class="team-section">
        <h2 class="section-title">צוות הפרויקט</h2>
        <div class="team-grid">
          <div class="team-card">
            <div class="img-wrapper">
              <img src="@/assets/aviva.jpg" alt="אביבה ברוריאן" />
            </div>
            <h3>אביבה ברוריאן</h3>
            <p>סטודנטית להנדסת תוכנה ומפתחת Full Stack.</p>
          </div>
          <div class="team-card">
            <div class="img-wrapper">
              <img src="@/assets/hodaya.jpg" alt="הודיה אברהם" />
            </div>
            <h3>הודיה אברהם</h3>
            <p>סטודנטית להנדסת תוכנה ומפתחת Full Stack.</p>
          </div>
          <div class="team-card mentor">
            <div class="img-wrapper">
              <img src="@/assets/HarelWallach.jpg" alt="מר הראל ולך" />
            </div>
            <h3>מר הראל ולך</h3>
            <p>מנחה אקדמי ומלווה הפרויקט.</p>
          </div>
        </div>
      </section>

      <section class="tech-section">
        <h2 class="section-title">ארכיטקטורה וטכנולוגיות</h2>
        <div class="tech-grid">
          <div class="tech-card">
            <div class="card-border-top"></div>
            <h3>Client Side</h3>
            <div class="tech-tags">
              <span>Vue.js 3</span><span>Vite</span><span>TypeScript</span><span>Pinia</span
              ><span>Vue Router</span><span>Axios</span><span>Leaflet</span><span>Sass</span
              ><span>Vitest</span>
            </div>
          </div>
          <div class="tech-card">
            <div class="card-border-top"></div>
            <h3>Server Side</h3>
            <div class="tech-tags">
              <span>Node.js</span><span>Express.js</span><span>REST API</span><span>Nodemailer</span
              ><span>Dotenv</span>
            </div>
          </div>
          <div class="tech-card">
            <div class="card-border-top"></div>
            <h3>Data & Security</h3>
            <div class="tech-tags">
              <span>MongoDB</span><span>Mongoose</span><span>Firebase Auth</span
              ><span>Firebase Admin</span><span>JWT</span>
            </div>
          </div>
          <div class="tech-card">
            <div class="card-border-top"></div>
            <h3>Tools & DevOps</h3>
            <div class="tech-tags">
              <span>Git & GitHub</span><span>Postman</span><span>Figma</span><span>VS Code</span
              ><span>Firebase Cloud</span>
            </div>
          </div>
        </div>
        <p class="academic-note">פותח כפרויקט גמר בעזריאלי מכללה אקדמית להנדסה ירושלים.</p>
      </section>
    </div>
  </div>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&display=swap');

.about-page {
  font-family: 'Heebo', sans-serif;
  background-color: #fdfbff;
  line-height: 1.6;
  color: #2d3436;
}

/* --- Hero Section המעודכן --- */
.hero-section {
  /* רקע גרדיאנט סגול יוקרתי */
  background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
  padding: 60px 20px 100px; /* הקטנתי את הריווח העליון */
  text-align: center;
  color: white;
  clip-path: ellipse(150% 100% at 50% 0%);
  position: relative;
}

.hero-content {
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}

/* עיצוב הלוגו - קטן ולבן */
.hero-logo {
  max-width: 150px; /* גודל מדויק לא גדול ולא קטן מדי */
  width: 100%;
  height: auto;
  margin: 0 auto 10px; /* רווח תחתון קטן לכותרת */
  display: block;
  /* הפילטר הזה הופך את הלוגו ללבן לגמרי! */
  filter: brightness(0) invert(1);
  opacity: 0.95;
}

/* הכותרת הראשית בלבן */
.main-title {
  font-size: 3rem; /* גודל מרשים אך לא ענק */
  font-weight: 900;
  color: #ffffff; /* טקסט לבן */
  margin: 0 0 15px 0; /* צמצום רווחים */
  letter-spacing: -1px;
  text-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.hero-subtitle {
  font-size: 1.2rem;
  font-weight: 300;
  max-width: 700px;
  margin: 0 auto 30px;
  color: rgba(255, 255, 255, 0.95); /* לבן עם שקיפות קלה למראה יוקרתי */
  line-height: 1.6;
}

/* תגיות ה-Hero */
.hero-badges {
  display: flex;
  justify-content: center;
  gap: 15px;
  flex-wrap: wrap;
}

.hero-badge {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  padding: 6px 16px;
  border-radius: 50px;
  font-weight: 600;
  font-size: 0.9rem;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* --- שאר העיצוב (נשאר זהה למה שהיה וביקשת לשמור) --- */
.main-container {
  max-width: 1100px;
  margin: -60px auto 60px;
  padding: 0 20px;
  position: relative;
  z-index: 5;
}

.section-title {
  text-align: center;
  color: #6c5ce7;
  margin-bottom: 50px;
  font-weight: 800;
  font-size: 2.2rem;
  letter-spacing: -0.5px;
}

/* Impact Section */
.impact-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-bottom: 100px;
  align-items: stretch;
}

.stats-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
}

.stat-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.08);
  text-align: center;
  transition: transform 0.3s ease;
  border-right: 5px solid #6c5ce7;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 900;
  color: #6c5ce7;
  margin-bottom: 10px;
}

.image-graph-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.08);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-header {
  margin-bottom: 20px;
  text-align: center;
}
.graph-header h3 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 5px;
}
.image-wrapper-graph {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #f1f2f6;
  padding: 10px;
}
.uploaded-graph {
  width: 100%;
  height: auto;
  object-fit: contain;
}

/* Flow Section */
.flow-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  text-align: center;
  margin-bottom: 100px;
  position: relative;
}
.flow-step {
  flex: 1;
  padding: 0 20px;
  position: relative;
  z-index: 2;
}
.step-number {
  width: 60px;
  height: 60px;
  background: white;
  color: #6c5ce7;
  border: 3px solid #6c5ce7;
  font-size: 1.8rem;
  font-weight: 900;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  box-shadow: 0 5px 15px rgba(108, 92, 231, 0.2);
}
.flow-line {
  flex: 1;
  height: 3px;
  background: #e0e0e0;
  margin-top: 30px;
  position: relative;
  z-index: 1;
}
.flow-step h3 {
  font-size: 1.3rem;
  margin-bottom: 10px;
  font-weight: 700;
}

/* Team Section */
.team-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
  margin-bottom: 100px;
}
.team-card {
  background: white;
  padding: 40px 30px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s;
}
.team-card:hover {
  transform: translateY(-5px);
}
.img-wrapper img {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #a29bfe;
  margin-bottom: 20px;
}

/* Tech Section */
.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}
.tech-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.03);
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 1px solid #f5f5f5;
}
.tech-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(108, 92, 231, 0.1);
}
.card-border-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: #a29bfe;
  transition: background 0.3s;
}
.tech-card:hover .card-border-top {
  background: #6c5ce7;
}
.tech-card h3 {
  margin-top: 10px;
  margin-bottom: 20px;
  font-size: 1.3rem;
  font-weight: 800;
  color: #2d3436;
}
.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.tech-tags span {
  background-color: #f8f9fa;
  color: #636e72;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  border: 1px solid #edf2f7;
  transition: all 0.2s;
}
.tech-tags span:hover {
  background-color: #6c5ce7;
  color: white;
  border-color: #6c5ce7;
}
.academic-note {
  text-align: center;
  margin-top: 60px;
  color: #b2bec3;
  font-style: italic;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .impact-grid {
    grid-template-columns: 1fr;
  }
  .flow-container {
    flex-direction: column;
    gap: 30px;
  }
  .flow-line {
    display: none;
  }
  .main-title {
    font-size: 2.2rem;
  }
  .hero-logo {
    max-width: 120px;
  }
}
</style>
