<template>
  <footer class="footer">
    <div class="footer-container">
      
      
      <div class="footer-col">
        <div class="footer-brand">
          <i class="fa-solid fa-bag-shopping brand-icon"></i>
          <h2>متجري</h2>
        </div>
        <p class="brand-desc">
          وجهتك الأولى للتسوق الإلكتروني الأسهل والأسرع. نوفر لك منتجات أصلية بجودة عالية وأسعار تنافسية مع خدمة توصيل سريع لجميع الأماكن.
        </p>
        <div class="social-icons">
          <a href="#" class="social-icon"><i class="fa-brands fa-facebook-f"></i></a>
          <a href="#" class="social-icon"><i class="fa-brands fa-instagram"></i></a>
          <a href="#" class="social-icon"><i class="fa-brands fa-twitter"></i></a>
          <a href="#" class="social-icon"><i class="fa-brands fa-linkedin-in"></i></a>
        </div>
      </div>

     
      <div class="footer-col">
        <h3>روابط سريعة</h3>
        <ul class="footer-links">
          <li><router-link to="/">الرئيسية</router-link></li>
          <li><router-link to="/cart">سلة المشتريات</router-link></li>
          <li><router-link to="/checkout">إتمام الطلب</router-link></li>
          <li><a href="#">من نحن</a></li>
        </ul>
      </div>

     
      <div class="footer-col">
        <h3>خدمة العملاء</h3>
        <ul class="footer-links">
          <li><a href="#">تواصل معنا</a></li>
          <li><a href="#">سياسة الاسترجاع والاستبدال</a></li>
          <li><a href="#">أسئلة شائعة</a></li>
          <li><a href="#">تتبع طلبك</a></li>
        </ul>
      </div>

      
      <div class="footer-col">
        <h3>طرق الدفع الآمنة</h3>
        <p class="payment-desc">نقبل الدفع عبر الوسائل الآتية بكل أمان:</p>
        <div class="payment-methods">
          <i class="fa-brands fa-cc-visa pay-icon"></i>
          <i class="fa-brands fa-cc-mastercard pay-icon"></i>
          <i class="fa-brands fa-cc-apple-pay pay-icon"></i>
          <i class="fa-solid fa-money-bill-wave pay-icon"></i>
        </div>
      </div>

    </div>

    
    <div class="footer-bottom">
      <p>جميع الحقوق محفوظة &copy;  متجري الإلكتروني </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background-color: #0f172a;
  color: #94a3b8;
  padding-top: 60px;
  margin-top: 80px;
  border-top: 1px solid #1e293b;
}

.footer-container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 20px 40px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 40px;
}

.footer-col h3 {
  color: #ffffff;
  font-size: 1.1rem;
  margin-bottom: 20px;
  font-weight: 700;
  position: relative;
  padding-bottom: 8px;
}

.footer-col h3::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 35px;
  height: 3px;
  background-color: #2563eb;
  border-radius: 2px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.brand-icon {
  font-size: 1.8rem;
  color: #2563eb;
}

.footer-brand h2 {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 800;
  margin: 0;
}

.brand-desc {
  font-size: 0.9rem;
  line-height: 1.7;
  margin-bottom: 20px;
  color: #94a3b8;
}

.social-icons {
  display: flex;
  gap: 12px;
}

.social-icon {
  width: 38px;
  height: 38px;
  background: #1e293b;
  color: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: all 0.3s ease;
}

.social-icon:hover {
  background: #2563eb;
  transform: translateY(-3px);
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer-links li a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.2s ease;
}

.footer-links li a:hover {
  color: #ffffff;
  padding-right: 5px;
}

.payment-desc {
  font-size: 0.9rem;
  margin-bottom: 15px;
}

.payment-methods {
  display: flex;
  gap: 15px;
  font-size: 2rem;
  color: #cbd5e1;
}

.pay-icon {
  transition: color 0.3s;
}

.pay-icon:hover {
  color: #2563eb;
}

.footer-bottom {
  background-color: #090d16;
  padding: 20px;
  text-align: center;
  border-top: 1px solid #1e293b;
  font-size: 0.9rem;
  color: #64748b;
}

@media (max-width: 768px) {
  .footer-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}
</style>