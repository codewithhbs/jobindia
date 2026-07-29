// utils/sendWhatsAppOTP.js

export const sendWhatsAppOTP = async (phone, otp) => {
  try {
    const params = new URLSearchParams({
      user: "Kishan_Solutions_BW",
      pass: "Kishan_Solutions_BW",
      sender: "BUZWAP",
      phone: String(phone),
      text: "otp_for_login",
      priority: "wa",
      stype: "auth",
      Params: String(otp),
    });

    const response = await fetch(
      `http://waapi.hoverbusinessservices.com/api/sendmsgutil.php?${params.toString()}`,
      {
        method: "GET",
      }
    );

    const data = await response.text(); 

    return {
      success: response.ok,
      data,
    };
  } catch (error) {
    console.error("WhatsApp OTP Error:", error);

    return {
      success: false,
      error: error.message,
    };
  }
};