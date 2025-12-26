// backend/services/aiService.js 
const fetch = require('node-fetch');
const aiConfig = require('../config/aiConfig');

class AIService {
  constructor() {
    this.systemPrompt = aiConfig.systemPrompt;
    this.hasOpenAI = !!aiConfig.openai.apiKey && aiConfig.openai.apiKey !== 'your_openai_key_here';
    console.log('🤖 AIService initialized');
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      console.log(`🤖 AI Request: "${userMessage.substring(0, 50)}..."`);
      
     
      if (process.env.GROQ_API_KEY) {
        try {
          console.log('🚀 Using Groq AI...');
          const response = await this.getGroqResponse(userMessage, conversationHistory);
          console.log('✅ Real Groq AI response received');
          return response;
        } catch (error) {
          console.log('❌ Groq AI failed:', error.message);
        }} 
      if (this.hasOpenAI) {
        try {
          console.log('🚀 Using OpenAI...');
          const response = await this.getOpenAIResponse(userMessage, conversationHistory);
          console.log('✅ Real OpenAI response received');
          return response;
        } catch (error) {
          console.log('❌ OpenAI failed:', error.message);
        }
      }
      try {
        console.log('🚀 Using HuggingFace AI as backup...');
        const response = await this.getHuggingFaceResponse(userMessage, conversationHistory);
        console.log('✅ HuggingFace AI response received');
        return response;
      } catch (error) {
        console.log('❌ HuggingFace failed:', error.message);
      } 
      console.log('🏠 Using intelligent fallback...');
      return this.getIntelligentFallback(userMessage, conversationHistory);
      
    } catch (error) {
      console.error('❌ AI Service Error:', error.message);
      return this.getIntelligentFallback(userMessage, conversationHistory);
    }
  }

  async getGroqResponse(userMessage, conversationHistory) {
   
    const formattedHistory = conversationHistory.map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text
    }));

    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...formattedHistory.slice(-6), 
      { role: 'user', content: userMessage }
    ];

    console.log('📤 Sending to Groq AI API...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
     model: 'llama-3.1-8b-instant',
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🚨 Groq API Error ${response.status}:`, errorText);
      
      if (response.status === 401) {
        throw new Error('Groq API key është i pavlefshëm');
      } else if (response.status === 429) {
        throw new Error('Groq rate limit - provo përsëri pas pak');
      } else {
        throw new Error(`Groq API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Groq AI përgjigje e pavlefshme');
    }

    const aiResponse = data.choices[0].message.content.trim();
    console.log('🤖 Real AI Response:', aiResponse.substring(0, 100) + '...');
    
    return aiResponse;
  }

  async getOpenAIResponse(userMessage, conversationHistory) {
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...conversationHistory.slice(-8),
      { role: 'user', content: userMessage }
    ];

    const requestBody = {
      model: aiConfig.openai.model,
      messages: messages,
      max_tokens: aiConfig.openai.maxTokens,
      temperature: aiConfig.openai.temperature,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    };

    console.log(`📤 Sending to OpenAI: ${messages.length} messages`);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiConfig.openai.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🚨 OpenAI API Error ${response.status}:`, errorText);
      
      if (response.status === 401) {
        throw new Error('OpenAI API key është i pavlefshëm');
      } else if (response.status === 429) {
        throw new Error('OpenAI rate limit - ka mbaruar quota');
      } else if (response.status === 402) {
        throw new Error('OpenAI account ka probleme me pagesën');
      } else {
        throw new Error(`OpenAI API error: ${response.status}`);
      }
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('OpenAI përgjigje e pavlefshme');
    }

    return data.choices[0].message.content.trim();
  }

  async getHuggingFaceResponse(userMessage, conversationHistory) {
    let contextPrompt = this.systemPrompt + '\n\n';
    
    if (conversationHistory.length > 0) {
      contextPrompt += 'Historia e bisedës:\n';
      conversationHistory.slice(-3).forEach(msg => {
        const role = msg.sender === 'user' ? 'Përdoruesi' : 'Asistenti';
        contextPrompt += `${role}: ${msg.text}\n`;
      });
    }
    
    contextPrompt += `\nPërdoruesi: ${userMessage}\nAsistenti:`;

    const response = await fetch(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large',
      {
        headers: {
          'Authorization': `Bearer hf_demo`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          inputs: contextPrompt,
          parameters: {
            max_length: 300,
            temperature: 0.7,
            do_sample: true,
            top_p: 0.9
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const result = await response.json();
    
    if (result[0]?.generated_text) {
      const fullText = result[0].generated_text;
      const assistantResponse = fullText.split('Asistenti:').pop().trim();
      return this.adaptToAlbanianContext(assistantResponse, userMessage);
    }
    
    throw new Error('HuggingFace response failed');
  }

  getIntelligentFallback(userMessage, conversationHistory) {
    const lowerMessage = userMessage.toLowerCase();
    const recentContext = conversationHistory.slice(-3).map(msg => msg.text.toLowerCase()).join(' ');
    
    if (lowerMessage.includes('mjekësi') || recentContext.includes('mjekësi')) {
      return `Për mjekësi në Shqipëri, mesatarja e kërkuar është zakonisht 9.0-9.5. Universiteti i Tiranës ka fakultetin më të vjetër, ndërsa AURAM dhe UET janë alternativa private. Procesi i pranimit është shumë konkurrues dhe kërkon përgatitje të mirë për provimin e shtetit.

A doni informacione për procesin e aplikimit ose kostot e studimit?`;
    }
    
    if (lowerMessage.includes('inxhinieri') || lowerMessage.includes('informatik')) {
      return `Inxhinieria e Informatikës ofron mundësi të shkëlqyera pune në Shqipëri:

💼 **Pozicione pune:**
• Zhvillues Software (40,000-80,000 lekë/muaj)
• Sistem Administrator (35,000-60,000 lekë/muaj)
• Data Scientist (50,000-90,000 lekë/muaj)
• Cybersecurity Specialist (45,000-75,000 lekë/muaj)

🏢 **Kompani të njohura:** Exelixis, Albania Telecom, Vodafone, dhe shumë startup.

🎓 **Universitete të mira:** Universiteti Politeknik dhe UET kanë programet më të forta.

A doni të dini për specializimet ose procesin e pranimit?`;
    }
    
    if (lowerMessage.includes('mesatare') || lowerMessage.includes('nota')) {
      return `Mesataret e pranuara variojnë sipas universitetit dhe drejtimit:

📊 **Universitete Publike:**
• Mjekësi: 9.0-9.5
• Inxhinieri Informatike: 8.0-8.5  
• Ekonomi/Biznes: 7.5-8.0
• Drejtësi: 8.0-8.5
• Arte: 7.0-7.5

🏢 **Universitete Private:**
• Kritere më fleksibël (7.0-8.5)
• Kostojnë 150,000-400,000 lekë/vit
• Shpesh kanë teste pranimi të veçanta

A keni menduar për ndonjë drejtim specifik?`;
    }
    
    if (lowerMessage.includes('universitet') || lowerMessage.includes('studim')) {
      return `Universitetet kryesore në Shqipëri:

🏛️ **Universitete Publike:**
• **UT (Universiteti i Tiranës)** - më i madhi, traditional, shumë fakultete
• **Universiteti Politeknik** - excellent për inxhinieri dhe arkitekturë
• **Universiteti Bujqësor** - specializuar në bujqësi dhe veterinari

🏢 **Universitete Private:**  
• **UET** - modern, teknologji, programe në anglisht
• **AURAM** - mjekësi dhe shëndetësi
• **Universiteti Kristal** - biznes dhe drejtësi

Çfarë drejtime ju interesojnë më shumë?`;
    }
    
    if (lowerMessage.includes('pse') || lowerMessage.length < 10) {
      return `Shërbimet AI janë përkohësisht të kufizuara, por mund t'ju ndihmoj me informacione për universitetet dhe karrierën në Shqipëri. 

A mund të jeni më specifik me pyetjen tuaj? Për shembull:
• "Cili universitet është më i mirë për..."
• "Sa është mesatarja për..."
• "Çfarë pune mund të gjej me..."`;
    }
    
    return `Si CareerBot për studentët në Shqipëri, mund t'ju ndihmoj me:

📚 **Informacione për universitete** (publike dhe private)
🎯 **Planifikim karriere** dhe orientim profesional  
📝 **Këshilla për CV** dhe aplikime
📊 **Mesatare dhe kritere** pranimi
💼 **Mundësi pune** për çdo drejtim
💰 **Kosto studimi** dhe bursa

Çfarë ju intereson më shumë?`;
  }

  adaptToAlbanianContext(response, originalMessage) {
    const adaptations = {
      'university': 'universitet',
      'college': 'fakultet',
      'career': 'karrierë',
      'job': 'punë',
      'study': 'studim',
      'student': 'student',
      'education': 'arsim',
      'degree': 'diplomë'
    };
    
    let adapted = response;
    for (const [eng, alb] of Object.entries(adaptations)) {
      adapted = adapted.replace(new RegExp(eng, 'gi'), alb);
    }
    

    if (originalMessage.toLowerCase().includes('universitet')) {
      adapted += '\n\nPër informacione më të detajuara për ndonjë universitet specifik, pyetni lirisht!';
    }
    
    return adapted;
  }

  async testConnection() {
    const results = {
      groq: false,
      openai: false,
      huggingface: false,
      timestamp: new Date()
    };

    if (process.env.GROQ_API_KEY) {
      try {
        await this.getGroqResponse('Test', []);
        results.groq = true;
      } catch (error) {
        console.log('Groq test failed:', error.message);
      }
    }


    if (this.hasOpenAI) {
      try {
        await this.getOpenAIResponse('Test', []);
        results.openai = true;
      } catch (error) {
        console.log('OpenAI test failed:', error.message);
      }
    }

   
    try {
      await this.getHuggingFaceResponse('Test', []);
      results.huggingface = true;
    } catch (error) {
      console.log('HuggingFace test failed:', error.message);
    }

    return results;
  }

  getServiceStatus() {
    return {
      groq: {
        configured: !!process.env.GROQ_API_KEY,
        model: 'llama3-70b-8192'
      },
      openai: {
        configured: this.hasOpenAI,
        model: aiConfig.openai.model
      },
      huggingface: {
        configured: true,
        model: 'DialoGPT-large'
      },
      fallback: {
        enabled: true,
        intelligent: true
      }
    };
  }
}

const aiServiceInstance = new AIService();
module.exports = aiServiceInstance;