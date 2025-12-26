import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* Navigation */}
      <nav className="navbar" style={{ background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
        <div className="container">
          <div className="navbar-container">
            <div className="navbar-brand">
              <span style={{ fontSize: '24px', color: '#4f46e5' }}>🎯</span>
              <span style={{ marginLeft: '8px', color: '#1f2937' }}>CareerGuide</span>
            </div>
            <div className="navbar-nav">
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link 
                to="/register" 
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main style={{ textAlign: 'center', padding: '80px 20px', color: 'white' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
         
          <div style={{ 
            fontSize: '120px', 
            marginBottom: '40px',
            filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))'
          }}>
            🚀
          </div>
          
          <h1 style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            marginBottom: '24px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Find Your Perfect
            <br />
            <span style={{ color: '#fbbf24' }}>Career Path</span>
          </h1>
          
          <p style={{ 
            fontSize: '20px', 
            marginBottom: '48px', 
            opacity: 0.9,
            lineHeight: 1.6
          }}>
            Discover your strengths through personalized assessments and 
            get expert guidance to achieve your career goals.
          </p>
          
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/register"
              className="btn btn-primary"
              style={{
                fontSize: '18px',
                padding: '16px 32px',
                background: '#fbbf24',
                border: 'none',
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(251, 191, 36, 0.4)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(251, 191, 36, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(251, 191, 36, 0.4)';
              }}
            >
              Start Assessment →
            </Link>
            
            <Link
              to="/about"
              className="btn"
              style={{
                fontSize: '18px',
                padding: '16px 32px',
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                textDecoration: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </main>

      <section style={{ 
        background: 'rgba(255, 255, 255, 0.95)', 
        padding: '80px 20px',
        backdropFilter: 'blur(10px)'
      }}>
        <div className="container">
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '36px', 
            marginBottom: '60px',
            color: '#1f2937'
          }}>
            Why Choose CareerGuide?
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '40px',
            maxWidth: '900px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}>
                🎯
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#1f2937'
              }}>
                Smart Assessments
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
                Take personalized tests to discover your unique strengths and career preferences.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}>
                👨‍🏫
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#1f2937'
              }}>
                Expert Guidance
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
                Connect with professional counselors for personalized career advice.
              </p>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                fontSize: '48px', 
                marginBottom: '20px',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}>
                🎓
              </div>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '12px',
                color: '#1f2937'
              }}>
                Perfect Match
              </h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6 }}>
                Get matched with careers and universities that fit your goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        background: '#1f2937', 
        color: 'white', 
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <div className="container">
          <div style={{ marginBottom: '20px' }}>
            <span style={{ fontSize: '20px' }}>🎯</span>
            <span style={{ marginLeft: '8px', fontSize: '18px', fontWeight: 'bold' }}>
              CareerGuide
            </span>
          </div>
          <p style={{ opacity: 0.8, marginBottom: '20px' }}>
            Empowering students to make informed career decisions.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
            <Link to="/about" style={{ color: '#9ca3af', textDecoration: 'none' }}>About</Link>
            <Link to="/contact" style={{ color: '#9ca3af', textDecoration: 'none' }}>Contact</Link>
            <Link to="/privacy" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy</Link>
            <Link to="/terms" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms</Link>
          </div>
          <p style={{ marginTop: '20px', opacity: 0.6, fontSize: '14px' }}>
            &copy; 2025 CareerGuide. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;