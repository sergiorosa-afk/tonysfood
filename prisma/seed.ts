import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function daysFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

function todayAt(hour: number, minute = 0) {
  const d = new Date()
  d.setHours(hour, minute, 0, 0)
  return d
}

function daysAgoAt(days: number, hour: number, minute = 0) {
  const d = daysFromNow(-days)
  d.setHours(hour, minute, 0, 0)
  return d
}

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Units ────────────────────────────────────────────────────────────────
  const unitA = await prisma.unit.upsert({
    where: { slug: 'matriz-centro' },
    update: {},
    create: {
      id: 'unit-001',
      name: "Tony's Food — Matriz Centro",
      slug: 'matriz-centro',
      address: 'Av. Paulista, 1000 — Bela Vista, São Paulo, SP',
      phone: '(11) 3333-4000',
    },
  })

  const unitB = await prisma.unit.upsert({
    where: { slug: 'unidade-jardins' },
    update: {},
    create: {
      id: 'unit-002',
      name: "Tony's Food — Jardins",
      slug: 'unidade-jardins',
      address: 'Rua Oscar Freire, 550 — Jardins, São Paulo, SP',
      phone: '(11) 3333-5000',
    },
  })

  // ─── Users ────────────────────────────────────────────────────────────────
  const pw = await bcrypt.hash('123456', 12)

  await prisma.user.upsert({
    where: { email: 'admin@tonysfood.local' },
    update: {},
    create: { id: 'user-001', name: 'Tony Almeida', email: 'admin@tonysfood.local', password: pw, role: "ADMIN", unitId: unitA.id },
  })
  await prisma.user.upsert({
    where: { email: 'gerente@tonysfood.local' },
    update: {},
    create: { id: 'user-002', name: 'Carlos Mendonça', email: 'gerente@tonysfood.local', password: pw, role: "MANAGER", unitId: unitA.id },
  })
  await prisma.user.upsert({
    where: { email: 'recepcionista@tonysfood.local' },
    update: {},
    create: { id: 'user-003', name: 'Ana Recepcionista', email: 'recepcionista@tonysfood.local', password: pw, role: "HOST", unitId: unitA.id },
  })
  await prisma.user.upsert({
    where: { email: 'atendimento@tonysfood.local' },
    update: {},
    create: { id: 'user-004', name: 'João Atendente', email: 'atendimento@tonysfood.local', password: pw, role: "ATTENDANT", unitId: unitA.id },
  })
  await prisma.user.upsert({
    where: { email: 'marketing@tonysfood.local' },
    update: {},
    create: { id: 'user-005', name: 'Mariana Marketing', email: 'marketing@tonysfood.local', password: pw, role: "MARKETING", unitId: unitA.id },
  })
  await prisma.user.upsert({
    where: { email: 'auditor@tonysfood.local' },
    update: {},
    create: { id: 'user-006', name: 'Paulo Auditor', email: 'auditor@tonysfood.local', password: pw, role: "AUDITOR", unitId: unitA.id },
  })
  await prisma.user.upsert({
    where: { email: 'gerente2@tonysfood.local' },
    update: {},
    create: { id: 'user-007', name: 'Sofia Gerente', email: 'gerente2@tonysfood.local', password: pw, role: "MANAGER", unitId: unitB.id },
  })

  // ─── Customers ────────────────────────────────────────────────────────────
  const customersData = [
    {
      id: 'cust-001', name: 'Maria Silva', phone: '(11) 98765-4321', email: 'maria.silva@email.com',
      segment: 'VIP', visitCount: 32, tags: ['vip', 'aniversariante', 'mesa-fixa'],
      preferences: ['mesa-janela', 'silenciosa', 'vinho-tinto'],
      restrictions: [] as string[],
      notes: 'Prefere mesa 7, próxima à janela. Aniversário em 15/08. Sempre vem às sextas-feiras com marido.',
    },
    {
      id: 'cust-002', name: 'João Santos', phone: '(11) 99123-4567', email: 'joao.santos@email.com',
      segment: 'REGULAR', visitCount: 11, tags: ['regular', 'almoço-corporativo'],
      preferences: ['cerveja-gelada', 'prato-executivo'],
      restrictions: ['gluten'],
      notes: 'Intolerante ao glúten — confirmar sempre. Vem geralmente às terças para almoço com equipe.',
    },
    {
      id: 'cust-003', name: 'Ana Oliveira', phone: '(11) 97654-3210', email: 'ana.oliveira@corp.com',
      segment: 'VIP', visitCount: 47, tags: ['vip', 'corporativo', 'fiel'],
      preferences: ['sala-privativa', 'cardapio-executivo', 'agua-sem-gas'],
      restrictions: [] as string[],
      notes: 'Diretora da empresa XYZ Corp. Frequenta para jantares corporativos. Solicita sempre nota fiscal CNPJ 12.345.678/0001-90.',
    },
    {
      id: 'cust-004', name: 'Carlos Pereira', phone: '(11) 96543-2109', email: 'carlos.p@email.com',
      segment: 'REGULAR', visitCount: 6, tags: ['regular'],
      preferences: [] as string[],
      restrictions: ['lactose'],
      notes: 'Intolerante à lactose. Gosta de fraldinha.',
    },
    {
      id: 'cust-005', name: 'Fernanda Costa', phone: '(11) 95432-1098', email: 'fecosta@email.com',
      segment: 'NEW', visitCount: 2, tags: ['novo', 'instagram'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: 'Veio pela primeira vez via Instagram Stories. Pediu mesa para comemorações.',
    },
    {
      id: 'cust-006', name: 'Roberto Lima', phone: '(11) 94321-0987', email: 'roberto.lima@empresa.com',
      segment: 'REGULAR', visitCount: 14, tags: ['regular', 'corporativo', 'grupo-grande'],
      preferences: ['mesa-grande', 'ambiente-festivo'],
      restrictions: [] as string[],
      notes: 'Organiza confraternizações de empresa. Grupos de 8-15 pessoas. Ligar com antecedência para confirmar disponibilidade.',
    },
    {
      id: 'cust-007', name: 'Juliana Rocha', phone: '(11) 93210-9876', email: 'juliana.rocha@email.com',
      segment: 'VIP', visitCount: 58, tags: ['vip', 'fiel', 'influencer'],
      preferences: ['mesa-1', 'vinho-casa', 'sobremesa-especial'],
      restrictions: ['frutos-do-mar'],
      notes: 'Influenciadora digital com 50k seguidores. Posta sempre fotos no Instagram. Alergia grave a frutos do mar — NUNCA servir. Cliente desde 2019.',
    },
    {
      id: 'cust-008', name: 'Marcos Alves', phone: '(11) 92109-8765', email: 'marcos.alves@email.com',
      segment: 'INACTIVE', visitCount: 3, tags: ['inativo'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: 'Última visita há 8 meses. Enviar campanha de reativação.',
    },
    {
      id: 'cust-009', name: 'Patricia Souza', phone: '(11) 91098-7654', email: 'patricia.s@email.com',
      segment: 'REGULAR', visitCount: 8, tags: ['regular', 'sem-gluten'],
      preferences: ['opções-sem-gluten'] as string[],
      restrictions: ['gluten'],
      notes: 'Doença celíaca confirmada. Sempre pergunta sobre contaminação cruzada.',
    },
    {
      id: 'cust-010', name: 'Lucas Ferreira', phone: '(11) 90987-6543', email: 'lucas.f@email.com',
      segment: 'NEW', visitCount: 2, tags: ['novo'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: '',
    },
    {
      id: 'cust-011', name: 'Camila Torres', phone: '(11) 89876-5432', email: 'camila.torres@email.com',
      segment: 'REGULAR', visitCount: 10, tags: ['regular', 'aniversariante'],
      preferences: [] as string[],
      restrictions: ['amendoim'],
      notes: 'Aniversário em 22/11. Alérgica a amendoim.',
    },
    {
      id: 'cust-012', name: 'Diego Martins', phone: '(11) 88765-4321', email: 'diego.m@email.com',
      segment: 'VIP', visitCount: 21, tags: ['vip', 'sommelier'],
      preferences: ['carta-de-vinhos', 'mesa-vip', 'degustacao'],
      restrictions: [] as string[],
      notes: 'Enófilo. Solicitar carta de vinhos especial. Já participou de 2 jantares harmonizados.',
    },
    {
      id: 'cust-013', name: 'Larissa Gomes', phone: '(11) 87654-3210', email: 'larissa.g@email.com',
      segment: 'REGULAR', visitCount: 7, tags: ['regular'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: '',
    },
    {
      id: 'cust-014', name: 'Felipe Cardoso', phone: '(11) 86543-2109', email: 'felipe.c@email.com',
      segment: 'NEW', visitCount: 1, tags: ['novo'],
      preferences: [] as string[],
      restrictions: ['lactose'],
      notes: '',
    },
    {
      id: 'cust-015', name: 'Isabela Nascimento', phone: '(11) 85432-1098', email: 'isabela.n@email.com',
      segment: 'REGULAR', visitCount: 18, tags: ['regular', 'fiel', 'sobremesas'],
      preferences: ['sobremesa-especial', 'cafe-expresso'],
      restrictions: [] as string[],
      notes: 'Fã declarada do Tiramisu. Já indicou 4 amigos.',
    },
    {
      id: 'cust-016', name: 'Gabriel Araújo', phone: '(11) 84321-0987', email: 'gabriel.a@holding.com',
      segment: 'VIP', visitCount: 35, tags: ['vip', 'corporativo', 'grupo-grande'],
      preferences: ['sala-privativa', 'cardapio-executivo', 'projetor'],
      restrictions: [] as string[],
      notes: 'CEO da Araújo Holding. Jantares de negócios mensais para 8-20 pessoas. Solicitar decoração corporativa.',
    },
    {
      id: 'cust-017', name: 'Tatiana Melo', phone: '(11) 83210-9876', email: 'tatiana.m@email.com',
      segment: 'INACTIVE', visitCount: 4, tags: ['inativo'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: 'Última visita há 6 meses. Reclamou do tempo de espera na última visita.',
    },
    {
      id: 'cust-018', name: 'André Rodrigues', phone: '(11) 82109-8765', email: 'andre.r@email.com',
      segment: 'REGULAR', visitCount: 13, tags: ['regular', 'bom-pagador'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: '',
    },
    {
      id: 'cust-019', name: 'Beatriz Santos', phone: '(11) 81098-7654', email: 'bea.santos@email.com',
      segment: 'NEW', visitCount: 1, tags: ['novo'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: 'Primeira visita — veio para comemorar promoção.',
    },
    {
      id: 'cust-020', name: 'Henrique Lima', phone: '(11) 80987-6543', email: 'henrique.l@email.com',
      segment: 'REGULAR', visitCount: 5, tags: ['regular'],
      preferences: [] as string[],
      restrictions: [] as string[],
      notes: '',
    },
    {
      id: 'cust-021', name: 'Renata Vieira', phone: '(11) 79876-5432', email: 'renata.v@email.com',
      segment: 'VIP', visitCount: 24, tags: ['vip', 'chef-conhecida'],
      preferences: ['mesa-chef', 'menu-degustacao'],
      restrictions: [] as string[],
      notes: 'Chef profissional. Aprecia pratos autorais e técnicas inovadoras. Visitas quinzenais.',
    },
    {
      id: 'cust-022', name: 'Bruno Carvalho', phone: '(11) 78765-4321', email: 'bruno.c@startup.io',
      segment: 'NEW', visitCount: 3, tags: ['novo', 'startup'],
      preferences: [] as string[],
      restrictions: ['vegetariano'],
      notes: 'Vegetariano. Co-founder de startup — vem para reuniões informais.',
    },
  ]

  const customers: Record<string, string> = {}
  for (const { tags, ...data } of customersData) {
    const c = await prisma.customer.upsert({
      where: { id: data.id },
      update: {},
      create: {
        ...data,
        unitId: unitA.id,
        lastVisitAt: data.visitCount > 0 ? daysAgoAt(Math.floor(Math.random() * 45) + 1, 20) : null,
      },
    })
    for (const tag of tags) {
      await prisma.customerTag.upsert({
        where: { customerId_tag: { customerId: c.id, tag } },
        update: {},
        create: { customerId: c.id, tag },
      })
    }
    customers[data.id] = c.id
  }

  // ─── Catalog Items ────────────────────────────────────────────────────────
  const catalogItems = [
    // Entradas
    { id: 'cat-001', name: 'Bruschetta Clássica', category: 'Entradas', description: 'Pão italiano tostado com tomate pelado, alho, manjericão fresco e azeite extravirgem siciliano', price: 28.90, tags: ['vegetariano', 'clássico'], allergens: ['gluten'], featured: false, active: true },
    { id: 'cat-002', name: 'Salada Caesar com Frango', category: 'Entradas', description: 'Alface romana crocante, croutons artesanais, lascas de parmesão, molho caesar e frango grelhado ao limão', price: 44.90, tags: ['leve', 'fitness', 'popular'], allergens: ['gluten', 'lactose', 'ovos'], featured: true, active: true },
    { id: 'cat-003', name: 'Ceviche Tropical', category: 'Entradas', description: 'Peixe branco fresco marinado em leite de tigre picante, manga, coentro e milho crocante', price: 52.90, tags: ['frutos-do-mar', 'refrescante', 'verao'], allergens: ['frutos-do-mar'], featured: false, active: true },
    { id: 'cat-004', name: 'Carpaccio de Filé', category: 'Entradas', description: 'Finas fatias de filé mignon com rúcula, alcaparras, parmesão e molho de mostarda Dijon', price: 58.90, tags: ['carne', 'fino'], allergens: ['lactose'], featured: true, active: true },
    { id: 'cat-005', name: 'Polpetone Gratinado', category: 'Entradas', description: 'Almôndegas artesanais ao molho pomodoro, gratinadas com mussarela de búfala e manjericão', price: 38.90, tags: ['carne', 'gratinado'], allergens: ['gluten', 'lactose'], featured: false, active: true },
    // Pratos Principais
    { id: 'cat-006', name: 'Filé à Parmegiana', category: 'Pratos Principais', description: 'Filé mignon empanado na farinha panko, coberto com molho de tomate artesanal e queijo mussarela gratinado. Acompanha arroz e fritas', price: 92.90, tags: ['carne', 'favorito', 'clássico'], allergens: ['gluten', 'lactose', 'ovos'], featured: true, active: true },
    { id: 'cat-007', name: 'Risoto de Camarão Rosa', category: 'Pratos Principais', description: 'Arroz arbóreo cremoso com camarão rosa grelhado, manteiga de ervas, parmesão e raspas de limão siciliano', price: 98.90, tags: ['frutos-do-mar', 'cremoso', 'favorito'], allergens: ['frutos-do-mar', 'lactose'], featured: true, active: true },
    { id: 'cat-008', name: 'Fraldinha na Brasa', category: 'Pratos Principais', description: 'Corte nobre de fraldinha maturada, grelhada na brasa, servida com chimichurri caseiro e batata ao murro', price: 82.90, tags: ['carne', 'brasa', 'nobre'], allergens: [], featured: true, active: true },
    { id: 'cat-009', name: 'Salmão ao Molho de Maracujá', category: 'Pratos Principais', description: 'Filé de salmão atlântico selado na manteiga com molho agridoce de maracujá, purê de mandioquinha e aspargos', price: 88.90, tags: ['peixe', 'agridoce', 'leve'], allergens: ['lactose', 'frutos-do-mar'], featured: false, active: true },
    { id: 'cat-010', name: 'Tagliatelle ao Ragù', category: 'Pratos Principais', description: 'Massa fresca artesanal com ragù de costela bovina cozido por 6h no vinho tinto, parmesão e trufa negra', price: 76.90, tags: ['massa', 'artesanal', 'lento'], allergens: ['gluten', 'lactose', 'ovos'], featured: false, active: true },
    { id: 'cat-011', name: 'Risoto de Funghi Secchi', category: 'Pratos Principais', description: 'Arroz arbóreo com mix de cogumelos selvagens hidratados, creme de parmesão e azeite trufado', price: 72.90, tags: ['vegetariano', 'cogumelos', 'cremoso'], allergens: ['lactose'], featured: false, active: true },
    { id: 'cat-012', name: 'Peixe do Dia Grelhado', category: 'Pratos Principais', description: 'Filé do peixe fresco do dia, grelhado com ervas provençais, acompanha legumes salteados e arroz integral', price: 79.90, tags: ['peixe', 'leve', 'saudavel'], allergens: ['frutos-do-mar'], featured: false, active: true },
    // Sobremesas
    { id: 'cat-013', name: 'Tiramisu Artesanal', category: 'Sobremesas', description: 'Clássico italiano com camadas de biscoito savoiardi, creme de mascarpone e café espresso intenso, finalizado com cacau', price: 34.90, tags: ['clássico', 'favorito', 'italiano'], allergens: ['lactose', 'gluten', 'ovos'], featured: true, active: true },
    { id: 'cat-014', name: 'Petit Gateau de Chocolate', category: 'Sobremesas', description: 'Bolinho de chocolate 70% quente com interior derretido, servido com sorvete de baunilha de Madagascar', price: 32.90, tags: ['chocolate', 'quente', 'favorito'], allergens: ['lactose', 'gluten', 'ovos'], featured: true, active: true },
    { id: 'cat-015', name: 'Panna Cotta de Maracujá', category: 'Sobremesas', description: 'Creme italiano aveludado de baunilha com calda de maracujá fresco e frutas vermelhas', price: 26.90, tags: ['italiano', 'fresco', 'leve'], allergens: ['lactose'], featured: false, active: true },
    { id: 'cat-016', name: 'Cheesecake de Frutas Vermelhas', category: 'Sobremesas', description: 'Cheesecake cremoso com base de biscoito, recheio de cream cheese e cobertura de mix de frutas vermelhas frescas', price: 28.90, tags: ['americano', 'frutas'], allergens: ['lactose', 'gluten', 'ovos'], featured: false, active: true },
    // Bebidas
    { id: 'cat-017', name: 'Caipirinha da Casa', category: 'Bebidas', description: 'Nossa receita exclusiva com cachaça artesanal mineira, limão-siciliano orgânico, mel de laranjeira e sal rosa do Himalaia', price: 24.90, tags: ['drink', 'alcoolico', 'classico'], allergens: [], featured: true, active: true },
    { id: 'cat-018', name: 'Gin Tônica Premium', category: 'Bebidas', description: 'Gin botânico com água tônica artesanal, pepino, zimbro e pimenta rosa. Servido em taça balão', price: 28.90, tags: ['drink', 'alcoolico', 'botanico'], allergens: [], featured: false, active: true },
    { id: 'cat-019', name: 'Suco Verde Detox', category: 'Bebidas', description: 'Blend de couve-manteiga, pepino, limão, gengibre, maçã verde e hortelã. 500ml', price: 18.90, tags: ['saudavel', 'sem-alcool', 'natural'], allergens: [], featured: false, active: true },
    { id: 'cat-020', name: 'Espresso Italiano', category: 'Bebidas', description: 'Blend exclusivo de grãos arábica e robusta, tostado médio, extraído em máquina La Marzocco', price: 9.90, tags: ['cafe', 'quente', 'classico'], allergens: [], featured: false, active: true },
  ]

  for (const item of catalogItems) {
    await prisma.catalogItem.upsert({
      where: { id: item.id },
      update: {},
      create: { ...item, unitId: unitA.id },
    })
  }

  // ─── Reservations ─────────────────────────────────────────────────────────
  const reservations = [
    // Hoje
    { id: 'res-001', customerId: 'cust-001', guestName: 'Maria Silva', guestPhone: '(11) 98765-4321', guestEmail: 'maria.silva@email.com', date: todayAt(12, 0), partySize: 4, status: "CONFIRMED", channel: "WHATSAPP", tablePreference: 'Mesa 7 — janela', notes: 'Aniversário do marido, pedir para decorar a mesa com balões', confirmedAt: daysAgoAt(1, 9) },
    { id: 'res-002', customerId: 'cust-003', guestName: 'Ana Oliveira', guestPhone: '(11) 97654-3210', guestEmail: 'ana.oliveira@corp.com', date: todayAt(13, 0), partySize: 8, status: "CONFIRMED", channel: "PHONE", tablePreference: 'Sala privativa', notes: 'Jantar corporativo XYZ Corp — solicitar nota fiscal CNPJ 12.345.678/0001-90', confirmedAt: daysAgoAt(2, 10) },
    { id: 'res-003', customerId: 'cust-004', guestName: 'Carlos Pereira', guestPhone: '(11) 96543-2109', guestEmail: 'carlos.p@email.com', date: todayAt(14, 30), partySize: 2, status: "PENDING", channel: "INSTAGRAM", tablePreference: null, notes: 'Intolerante à lactose — confirmar cardápio', confirmedAt: null },
    { id: 'res-004', customerId: 'cust-006', guestName: 'Roberto Lima', guestPhone: '(11) 94321-0987', guestEmail: 'roberto.lima@empresa.com', date: todayAt(19, 0), partySize: 12, status: "CONFIRMED", channel: "PHONE", tablePreference: 'Mesas unidas — salão principal', notes: 'Confraternização de fim de ano — 12 pessoas', confirmedAt: daysAgoAt(3, 11) },
    { id: 'res-005', customerId: 'cust-007', guestName: 'Juliana Rocha', guestPhone: '(11) 93210-9876', guestEmail: 'juliana.rocha@email.com', date: todayAt(20, 0), partySize: 2, status: "CHECKED_IN", channel: "WHATSAPP", tablePreference: 'Mesa 1', notes: 'ALERGIA GRAVE a frutos do mar — não servir nenhum prato', confirmedAt: daysAgoAt(1, 15), checkedInAt: todayAt(19, 55) },
    { id: 'res-006', customerId: 'cust-012', guestName: 'Diego Martins', guestPhone: '(11) 88765-4321', guestEmail: 'diego.m@email.com', date: todayAt(20, 30), partySize: 4, status: "CONFIRMED", channel: "APP", tablePreference: 'Mesa VIP', notes: 'Solicitar carta de vinhos premium ao receber', confirmedAt: daysAgoAt(2, 16) },
    { id: 'res-007', customerId: 'cust-016', guestName: 'Gabriel Araújo', guestPhone: '(11) 84321-0987', guestEmail: 'gabriel.a@holding.com', date: todayAt(21, 0), partySize: 6, status: "PENDING", channel: "PHONE", tablePreference: null, notes: 'Jantar de negócios — confirmar se sala privativa está disponível', confirmedAt: null },
    // Próximos dias
    { id: 'res-008', customerId: 'cust-005', guestName: 'Fernanda Costa', guestPhone: '(11) 95432-1098', guestEmail: 'fecosta@email.com', date: daysFromNow(1), partySize: 3, status: "PENDING", channel: "WHATSAPP", tablePreference: null, notes: 'Primeira visita da cliente — via Instagram', confirmedAt: null },
    { id: 'res-009', customerId: 'cust-016', guestName: 'Gabriel Araújo', guestPhone: '(11) 84321-0987', guestEmail: 'gabriel.a@holding.com', date: daysFromNow(2), partySize: 18, status: "CONFIRMED", channel: "PHONE", tablePreference: 'Salão completo', notes: 'Assembleia anual da holding — jantar de gala. Solicitar decoração corporativa e projetor', confirmedAt: new Date() },
    { id: 'res-010', customerId: 'cust-015', guestName: 'Isabela Nascimento', guestPhone: '(11) 85432-1098', guestEmail: 'isabela.n@email.com', date: daysFromNow(2), partySize: 2, status: "CONFIRMED", channel: "WHATSAPP", tablePreference: null, notes: 'Pedir Tiramisu especial de aniversário', confirmedAt: new Date() },
    { id: 'res-011', customerId: 'cust-010', guestName: 'Lucas Ferreira', guestPhone: '(11) 90987-6543', guestEmail: 'lucas.f@email.com', date: daysFromNow(3), partySize: 4, status: "PENDING", channel: "INSTAGRAM", tablePreference: null, notes: null, confirmedAt: null },
    { id: 'res-012', customerId: 'cust-021', guestName: 'Renata Vieira', guestPhone: '(11) 79876-5432', guestEmail: 'renata.v@email.com', date: daysFromNow(4), partySize: 2, status: "CONFIRMED", channel: "PHONE", tablePreference: 'Mesa do chef', notes: 'Chef Renata Vieira — menu degustação, avisar cozinha', confirmedAt: new Date() },
    { id: 'res-013', customerId: 'cust-003', guestName: 'Ana Oliveira', guestPhone: '(11) 97654-3210', guestEmail: 'ana.oliveira@corp.com', date: daysFromNow(7), partySize: 5, status: "CONFIRMED", channel: "PHONE", tablePreference: 'Sala privativa', notes: 'Reunião de diretoria', confirmedAt: new Date() },
    { id: 'res-014', customerId: 'cust-022', guestName: 'Bruno Carvalho', guestPhone: '(11) 78765-4321', guestEmail: 'bruno.c@startup.io', date: daysFromNow(5), partySize: 3, status: "PENDING", channel: "APP", tablePreference: null, notes: 'Vegetariano — confirmar opções no cardápio', confirmedAt: null },
    // Passado
    { id: 'res-015', customerId: 'cust-002', guestName: 'João Santos', guestPhone: '(11) 99123-4567', guestEmail: 'joao.santos@email.com', date: daysAgoAt(1, 13), partySize: 2, status: "COMPLETED", channel: "PHONE", tablePreference: null, notes: null, confirmedAt: daysAgoAt(2, 9), checkedInAt: daysAgoAt(1, 12, 55) },
    { id: 'res-016', customerId: 'cust-008', guestName: 'Marcos Alves', guestPhone: '(11) 92109-8765', guestEmail: 'marcos.alves@email.com', date: daysAgoAt(2, 20), partySize: 5, status: "NO_SHOW", channel: "WHATSAPP", tablePreference: null, notes: 'Não apareceu e não avisou', confirmedAt: daysAgoAt(3, 10) },
    { id: 'res-017', customerId: 'cust-009', guestName: 'Patricia Souza', guestPhone: '(11) 91098-7654', guestEmail: 'patricia.s@email.com', date: daysAgoAt(3, 19), partySize: 3, status: "COMPLETED", channel: "PHONE", tablePreference: null, notes: 'Celíaca — confirmar pratos', confirmedAt: daysAgoAt(4, 11), checkedInAt: daysAgoAt(3, 18, 50) },
    { id: 'res-018', customerId: 'cust-017', guestName: 'Tatiana Melo', guestPhone: '(11) 83210-9876', guestEmail: 'tatiana.m@email.com', date: daysAgoAt(5, 20), partySize: 2, status: "CANCELLED", channel: "WHATSAPP", tablePreference: null, notes: 'Cancelou 2h antes — disse que estava doente', cancelledAt: daysAgoAt(5, 18) },
    { id: 'res-019', customerId: 'cust-018', guestName: 'André Rodrigues', guestPhone: '(11) 82109-8765', guestEmail: 'andre.r@email.com', date: daysAgoAt(7, 13), partySize: 4, status: "COMPLETED", channel: "PHONE", tablePreference: null, notes: null, confirmedAt: daysAgoAt(8, 10), checkedInAt: daysAgoAt(7, 12, 58) },
    { id: 'res-020', customerId: 'cust-001', guestName: 'Maria Silva', guestPhone: '(11) 98765-4321', guestEmail: 'maria.silva@email.com', date: daysAgoAt(10, 20), partySize: 4, status: "COMPLETED", channel: "WHATSAPP", tablePreference: 'Mesa 7', notes: null, confirmedAt: daysAgoAt(11, 9), checkedInAt: daysAgoAt(10, 19, 50) },
    { id: 'res-021', customerId: 'cust-007', guestName: 'Juliana Rocha', guestPhone: '(11) 93210-9876', guestEmail: 'juliana.rocha@email.com', date: daysAgoAt(14, 21), partySize: 2, status: "COMPLETED", channel: "WHATSAPP", tablePreference: 'Mesa 1', notes: 'Postou foto no Instagram — engajamento alto', confirmedAt: daysAgoAt(15, 16), checkedInAt: daysAgoAt(14, 20, 45) },
  ]

  for (const r of reservations) {
    const { customerId, cancelledAt, checkedInAt, confirmedAt, ...rest } = r as any
    await prisma.reservation.upsert({
      where: { id: r.id },
      update: {},
      create: {
        ...rest,
        customerId,
        unitId: unitA.id,
        cancelledAt: cancelledAt ?? null,
        checkedInAt: checkedInAt ?? null,
        confirmedAt: confirmedAt ?? null,
      },
    })
  }

  // Status history for selected reservations
  const statusHistories = [
    { id: 'rsh-001', reservationId: 'res-001', status: "PENDING", createdAt: daysAgoAt(2, 8) },
    { id: 'rsh-002', reservationId: 'res-001', status: "CONFIRMED", createdAt: daysAgoAt(1, 9) },
    { id: 'rsh-003', reservationId: 'res-005', status: "PENDING", createdAt: daysAgoAt(2, 14) },
    { id: 'rsh-004', reservationId: 'res-005', status: "CONFIRMED", createdAt: daysAgoAt(1, 15) },
    { id: 'rsh-005', reservationId: 'res-005', status: "CHECKED_IN", notes: 'Cliente chegou 5 min antes', createdAt: todayAt(19, 55) },
    { id: 'rsh-006', reservationId: 'res-015', status: "PENDING", createdAt: daysAgoAt(3, 17) },
    { id: 'rsh-007', reservationId: 'res-015', status: "CONFIRMED", createdAt: daysAgoAt(2, 9) },
    { id: 'rsh-008', reservationId: 'res-015', status: "CHECKED_IN", createdAt: daysAgoAt(1, 12, 55) },
    { id: 'rsh-009', reservationId: 'res-015', status: "COMPLETED", createdAt: daysAgoAt(1, 14, 30) },
    { id: 'rsh-010', reservationId: 'res-016', status: "PENDING", createdAt: daysAgoAt(4, 10) },
    { id: 'rsh-011', reservationId: 'res-016', status: "CONFIRMED", createdAt: daysAgoAt(3, 10) },
    { id: 'rsh-012', reservationId: 'res-016', status: "NO_SHOW", notes: 'Cliente não compareceu após 1h de espera', createdAt: daysAgoAt(2, 21) },
    { id: 'rsh-013', reservationId: 'res-018', status: "PENDING", createdAt: daysAgoAt(7, 14) },
    { id: 'rsh-014', reservationId: 'res-018', status: "CONFIRMED", createdAt: daysAgoAt(6, 11) },
    { id: 'rsh-015', reservationId: 'res-018', status: "CANCELLED", notes: 'Cliente cancelou por doença', createdAt: daysAgoAt(5, 18) },
  ]

  for (const h of statusHistories) {
    await prisma.reservationStatusHistory.upsert({
      where: { id: h.id },
      update: {},
      create: h,
    })
  }

  // ─── Queue Entries ────────────────────────────────────────────────────────
  const queueEntries = [
    // Aguardando
    { id: 'queue-001', customerId: 'cust-011', guestName: 'Camila Torres', guestPhone: '(11) 89876-5432', partySize: 3, position: 1, status: "WAITING", channel: "IN_PERSON", estimatedWait: 15, notes: 'Alérgica a amendoim' },
    { id: 'queue-002', customerId: 'cust-014', guestName: 'Felipe Cardoso', guestPhone: '(11) 86543-2109', partySize: 2, position: 2, status: "WAITING", channel: "WHATSAPP", estimatedWait: 30, notes: null },
    { id: 'queue-003', customerId: 'cust-019', guestName: 'Beatriz Santos', guestPhone: '(11) 81098-7654', partySize: 4, position: 3, status: "WAITING", channel: "IN_PERSON", estimatedWait: 45, notes: null },
    { id: 'queue-004', customerId: 'cust-020', guestName: 'Henrique Lima', guestPhone: '(11) 80987-6543', partySize: 2, position: 4, status: "WAITING", channel: "PHONE", estimatedWait: 60, notes: null },
    { id: 'queue-005', customerId: null, guestName: 'Paulo Mendes', guestPhone: '(11) 79765-4321', partySize: 6, position: 5, status: "WAITING", channel: "IN_PERSON", estimatedWait: 80, notes: 'Grupo com criança pequena — mesa com cadeirinha' },
    // Chamado
    { id: 'queue-006', customerId: 'cust-013', guestName: 'Larissa Gomes', guestPhone: '(11) 87654-3210', partySize: 2, position: 0, status: "CALLED", channel: "IN_PERSON", estimatedWait: 0, notes: null, calledAt: todayAt(19, 45) },
    // Sentado hoje
    { id: 'queue-007', customerId: null, guestName: 'Marcus Silva', guestPhone: '(11) 78654-3210', partySize: 3, position: 0, status: "SEATED", channel: "IN_PERSON", estimatedWait: 0, notes: null, calledAt: todayAt(19, 0), seatedAt: todayAt(19, 10) },
    { id: 'queue-008', customerId: 'cust-002', guestName: 'João Santos', guestPhone: '(11) 99123-4567', partySize: 2, position: 0, status: "SEATED", channel: "WHATSAPP", estimatedWait: 0, notes: null, calledAt: todayAt(18, 45), seatedAt: todayAt(18, 52) },
    { id: 'queue-009', customerId: null, guestName: 'Ricardo Nunes', guestPhone: '(11) 76543-2109', partySize: 5, position: 0, status: "SEATED", channel: "IN_PERSON", estimatedWait: 0, notes: 'Grupo corporativo — pediram mesa grande', calledAt: todayAt(18, 15), seatedAt: todayAt(18, 22) },
    // Abandonou
    { id: 'queue-010', customerId: null, guestName: 'Vanessa Pinto', guestPhone: '(11) 75432-1098', partySize: 2, position: 0, status: "ABANDONED", channel: "IN_PERSON", estimatedWait: 0, notes: null, abandonedAt: todayAt(18, 0), abandonReason: 'Tempo de espera longo' },
    { id: 'queue-011', customerId: null, guestName: 'Priscila Ramos', guestPhone: '(11) 74321-0987', partySize: 3, position: 0, status: "ABANDONED", channel: "WHATSAPP", estimatedWait: 0, notes: null, abandonedAt: todayAt(17, 30), abandonReason: 'Sem retorno no WhatsApp' },
  ]

  for (const q of queueEntries) {
    const { customerId, calledAt, seatedAt, abandonedAt, abandonReason, ...rest } = q as any
    await prisma.queueEntry.upsert({
      where: { id: q.id },
      update: {},
      create: {
        ...rest,
        customerId,
        unitId: unitA.id,
        calledAt: calledAt ?? null,
        seatedAt: seatedAt ?? null,
        abandonedAt: abandonedAt ?? null,
        abandonReason: abandonReason ?? null,
      },
    })
  }

  // ─── Conversations + Messages ──────────────────────────────────────────────
  type ConvMsg = { direction: string; content: string; deltaMin: number }
  const convDefs: Array<{
    id: string; customerId: string | null; guestName: string; guestPhone: string
    status: string; lastMessageAt: Date
    messages: ConvMsg[]
  }> = [
    {
      id: 'conv-001', customerId: 'cust-001', guestName: 'Maria Silva', guestPhone: '(11) 98765-4321',
      status: "OPEN", lastMessageAt: todayAt(10, 15),
      messages: [
        { direction: "INBOUND", content: 'Oi! Gostaria de fazer uma reserva para hoje à noite para 4 pessoas, às 20h. É possível?', deltaMin: -45 },
        { direction: "OUTBOUND", content: 'Olá, Maria! Claro, temos disponibilidade para hoje às 20h para 4 pessoas. 😊 Posso confirmar no nome de Maria Silva?', deltaMin: -42 },
        { direction: "INBOUND", content: 'Sim, perfeito! É aniversário do meu marido, tem como decorar a mesa com alguma coisa?', deltaMin: -40 },
        { direction: "OUTBOUND", content: 'Que delicioso! 🎂 Claro, podemos colocar balões e uma plaquinha especial na mesa. Sem custo adicional! Prefere alguma mesa em especial?', deltaMin: -38 },
        { direction: "INBOUND", content: 'A mesa 7, perto da janela, se tiver disponível seria ótimo!', deltaMin: -36 },
        { direction: "OUTBOUND", content: 'Reservado! Mesa 7 às 20h para 4 pessoas, decorada para o aniversário. 🎉 Te esperamos! Qualquer dúvida é só chamar.', deltaMin: -30 },
      ],
    },
    {
      id: 'conv-002', customerId: 'cust-002', guestName: 'João Santos', guestPhone: '(11) 99123-4567',
      status: "OPEN", lastMessageAt: todayAt(11, 42),
      messages: [
        { direction: "INBOUND", content: 'Boa tarde! Tenho intolerância ao glúten. Vocês têm opções no cardápio?', deltaMin: -60 },
        { direction: "OUTBOUND", content: 'Olá, João! Temos sim! 😊 Nosso cardápio conta com diversas opções sem glúten, incluindo o Salmão ao Molho de Maracujá, a Fraldinha na Brasa e o Risoto de Funghi. Todas preparadas com cuidado para evitar contaminação cruzada.', deltaMin: -55 },
        { direction: "INBOUND", content: 'Perfeito! E o horário de almoço é até que horas?', deltaMin: -50 },
        { direction: "OUTBOUND", content: 'Atendemos no almoço das 11h30 às 15h30, de terça a domingo. Posso fazer uma reserva para você?', deltaMin: -45 },
        { direction: "INBOUND", content: 'Pode ser para amanhã, terça, às 12h30 para 2 pessoas?', deltaMin: -20 },
        { direction: "OUTBOUND", content: 'Prontinho! Reserva confirmada: terça-feira, 12h30, 2 pessoas, em nome de João Santos. Te aguardamos! 👍', deltaMin: -15 },
      ],
    },
    {
      id: 'conv-003', customerId: 'cust-003', guestName: 'Ana Oliveira', guestPhone: '(11) 97654-3210',
      status: "PENDING", lastMessageAt: todayAt(9, 5),
      messages: [
        { direction: "INBOUND", content: 'Bom dia! Preciso alterar a reserva de hoje às 13h para as 14h. É possível?', deltaMin: -120 },
        { direction: "OUTBOUND", content: 'Bom dia, Ana! Verificando a disponibilidade... Um momento, por favor.', deltaMin: -118 },
        { direction: "INBOUND", content: 'Ok, pode conferir com calma. Obrigada!', deltaMin: -116 },
      ],
    },
    {
      id: 'conv-004', customerId: 'cust-004', guestName: 'Carlos Pereira', guestPhone: '(11) 96543-2109',
      status: "OPEN", lastMessageAt: todayAt(12, 30),
      messages: [
        { direction: "INBOUND", content: 'Boa tarde! Tem mesa disponível para agora? Somos 2 pessoas.', deltaMin: -90 },
        { direction: "OUTBOUND", content: 'Olá, Carlos! Infelizmente no momento temos uma fila de espera de aproximadamente 20 minutos. Gostaria de entrar na lista?', deltaMin: -85 },
        { direction: "INBOUND", content: 'Sim, pode colocar na lista por favor.', deltaMin: -80 },
        { direction: "OUTBOUND", content: 'Feito! Você está na posição 3 da fila. ✅ Avisaremos assim que sua mesa estiver pronta. O tempo estimado é de 20 a 25 minutos.', deltaMin: -78 },
        { direction: "INBOUND", content: 'Certo, estou chegando já.', deltaMin: -75 },
      ],
    },
    {
      id: 'conv-005', customerId: 'cust-005', guestName: 'Fernanda Costa', guestPhone: '(11) 95432-1098',
      status: "PENDING", lastMessageAt: daysAgoAt(0, 8, 0),
      messages: [
        { direction: "INBOUND", content: 'Oi! Vi o restaurante no Instagram, ficou lindo! Gostaria de fazer uma reserva para o aniversário da minha mãe no próximo sábado. São 10 pessoas 🎂', deltaMin: -240 },
        { direction: "OUTBOUND", content: 'Que gentileza, Fernanda! Fico feliz que tenha gostado! 😊 Para 10 pessoas no sábado temos disponibilidade! Qual horário prefere — almoço ou jantar?', deltaMin: -235 },
        { direction: "INBOUND", content: 'Jantar, às 20h seria perfeito!', deltaMin: -230 },
      ],
    },
    {
      id: 'conv-006', customerId: null, guestName: 'Cliente Novo', guestPhone: '(11) 94000-0001',
      status: "OPEN", lastMessageAt: todayAt(14, 20),
      messages: [
        { direction: "INBOUND", content: 'Olá! Vocês têm menu executivo no almoço?', deltaMin: -30 },
        { direction: "OUTBOUND", content: 'Olá! Sim, temos Menu Executivo de segunda a sexta, das 11h30 às 15h. Inclui entrada + prato principal + sobremesa por R$89,90. Gostaria de fazer uma reserva?', deltaMin: -25 },
        { direction: "INBOUND", content: 'Que preço! Tenho interesse sim. Vocês aceitam cartão?', deltaMin: -10 },
        { direction: "OUTBOUND", content: 'Aceitamos todas as bandeiras de cartão, débito, crédito e Pix! 💳', deltaMin: -8 },
        { direction: "INBOUND", content: 'Ótimo! Podem reservar para amanhã, 3 pessoas, ao meio-dia?', deltaMin: -5 },
      ],
    },
    {
      id: 'conv-007', customerId: 'cust-007', guestName: 'Juliana Rocha', guestPhone: '(11) 93210-9876',
      status: "RESOLVED", lastMessageAt: daysAgoAt(1, 22, 30),
      messages: [
        { direction: "INBOUND", content: 'Boa noite! Acabei de postar sobre o jantar de hoje no Instagram. A comida estava simplesmente incrível! O Filé à Parmegiana estava perfeito 🤤', deltaMin: -30 },
        { direction: "OUTBOUND", content: 'Juliana, que notícia maravilhosa! 🥰 Ficamos muito felizes que tenha aprovado. A equipe toda vai adorar saber. Já vimos o post — ficou lindo! Obrigada pela indicação.', deltaMin: -25 },
        { direction: "INBOUND", content: 'Com certeza voltarei em breve! Obrigada pelo atendimento excepcional.', deltaMin: -20 },
        { direction: "OUTBOUND", content: 'É sempre um prazer recebê-la, Juliana! Te esperamos para o próximo jantar. 🍷✨', deltaMin: -15 },
      ],
    },
    {
      id: 'conv-008', customerId: 'cust-008', guestName: 'Marcos Alves', guestPhone: '(11) 92109-8765',
      status: "CLOSED", lastMessageAt: daysAgoAt(2, 21, 0),
      messages: [
        { direction: "INBOUND", content: 'Oi, preciso cancelar minha reserva de hoje à noite.', deltaMin: -180 },
        { direction: "OUTBOUND", content: 'Olá, Marcos! Entendido. Vou cancelar sua reserva. Aconteceu algum imprevisto? Posso reagendar para outra data?', deltaMin: -175 },
        { direction: "INBOUND", content: 'Tive um compromisso de última hora. Posso marcar outro dia?', deltaMin: -170 },
        { direction: "OUTBOUND", content: 'Claro! Reserva cancelada. Quando quiser, é só nos chamar aqui ou pelo telefone (11) 3333-4000. Te aguardamos! 😊', deltaMin: -160 },
      ],
    },
    {
      id: 'conv-009', customerId: 'cust-016', guestName: 'Gabriel Araújo', guestPhone: '(11) 84321-0987',
      status: "OPEN", lastMessageAt: todayAt(9, 45),
      messages: [
        { direction: "INBOUND", content: 'Bom dia. Sou o Gabriel Araújo da Araújo Holding. Preciso confirmar os detalhes do jantar de amanhã para 18 pessoas.', deltaMin: -180 },
        { direction: "OUTBOUND", content: 'Bom dia, Sr. Gabriel! Confirmado para amanhã às 21h, 18 pessoas, salão completo. Vamos preparar a decoração corporativa e o projetor conforme solicitado.', deltaMin: -175 },
        { direction: "INBOUND", content: 'Perfeito. Haverá uma apresentação de slides de cerca de 20 minutos. Precisamos de tela também.', deltaMin: -120 },
        { direction: "OUTBOUND", content: 'Anotado! Vou providenciar a tela de projeção também. Há alguma preferência no cardápio ou restrições alimentares que devo informar à cozinha?', deltaMin: -115 },
        { direction: "INBOUND", content: 'Dois participantes são vegetarianos. O restante come de tudo.', deltaMin: -60 },
      ],
    },
    {
      id: 'conv-010', customerId: 'cust-017', guestName: 'Tatiana Melo', guestPhone: '(11) 83210-9876',
      status: "RESOLVED", lastMessageAt: daysAgoAt(4, 17, 15),
      messages: [
        { direction: "INBOUND", content: 'Boa tarde, na última vez que vim fui muito mal atendida. Fiquei esperando 40 minutos por um garçom e ninguém veio.', deltaMin: -120 },
        { direction: "OUTBOUND", content: 'Tatiana, sentimos muito pelo ocorrido. Isso não condiz com o padrão de atendimento que prezamos. Pode nos contar mais sobre quando aconteceu para que possamos apurar internamente?', deltaMin: -115 },
        { direction: "INBOUND", content: 'Foi no sábado passado, estava com uma amiga, mesa no fundo do salão.', deltaMin: -110 },
        { direction: "OUTBOUND", content: 'Vamos verificar junto à equipe. Gostaríamos de convidá-la para uma nova visita com desconto de 20% como forma de pedido de desculpas. O que acha?', deltaMin: -100 },
        { direction: "INBOUND", content: 'Ok, aceito. Obrigada pela atenção.', deltaMin: -90 },
        { direction: "OUTBOUND", content: 'Ótimo! Vou gerar um cupom e enviar em seguida. Até breve! 🙏', deltaMin: -85 },
      ],
    },
  ]

  for (const def of convDefs) {
    const { messages, ...convData } = def
    const conv = await prisma.conversation.upsert({
      where: { id: def.id },
      update: {},
      create: { ...convData, unitId: unitA.id },
    })
    for (let i = 0; i < messages.length; i++) {
      const msgId = `msg-${def.id}-${i}`
      const { deltaMin, ...msgData } = messages[i]
      const createdAt = new Date(def.lastMessageAt.getTime() + deltaMin * 60 * 1000)
      await prisma.message.upsert({
        where: { id: msgId },
        update: {},
        create: {
          id: msgId,
          conversationId: conv.id,
          ...msgData,
          senderName: msgData.direction === "INBOUND" ? def.guestName : "Tony's Food",
          createdAt,
        },
      })
    }
  }

  // ─── Message Templates ────────────────────────────────────────────────────
  const templates = [
    {
      id: 'tmpl-001',
      name: 'Confirmação de Reserva',
      category: 'reservations',
      body: 'Olá, {{nome}}! 🎉 Sua reserva no Tony\'s Food foi confirmada para {{data}} às {{hora}}, para {{pessoas}} pessoas. Te esperamos! Qualquer dúvida, é só nos chamar.',
      variables: ['nome', 'data', 'hora', 'pessoas'],
    },
    {
      id: 'tmpl-002',
      name: 'Lembrete 24h Antes',
      category: 'reservations',
      body: 'Olá, {{nome}}! 👋 Lembramos que amanhã você tem reserva no Tony\'s Food às {{hora}} para {{pessoas}} pessoas. Caso precise alterar ou cancelar, entre em contato com antecedência. Te esperamos!',
      variables: ['nome', 'hora', 'pessoas'],
    },
    {
      id: 'tmpl-003',
      name: 'Boas-vindas — Novo Cliente',
      category: 'general',
      body: 'Bem-vindo(a) ao Tony\'s Food, {{nome}}! 🍽️ Ficamos muito felizes com sua primeira visita. Esperamos que tenha aprovado nossa culinária. Siga-nos no Instagram @tonysfood para novidades e promoções exclusivas!',
      variables: ['nome'],
    },
    {
      id: 'tmpl-004',
      name: 'Mesa Pronta — Fila',
      category: 'queue',
      body: 'Oi, {{nome}}! ✅ Sua mesa está pronta! Pode se dirigir à recepção do Tony\'s Food. Você tem 10 minutos para check-in. Te esperamos!',
      variables: ['nome'],
    },
    {
      id: 'tmpl-005',
      name: 'Avaliação Pós-visita',
      category: 'feedback',
      body: 'Olá, {{nome}}! 😊 Foi um prazer tê-lo(a) no Tony\'s Food. Sua opinião é muito importante para nós! Como você avalia sua experiência de hoje? (1 a 5 ⭐)',
      variables: ['nome'],
    },
    {
      id: 'tmpl-006',
      name: 'Promoção Reativação',
      category: 'marketing',
      body: 'Sentimos sua falta, {{nome}}! 🥺 Faz um tempo que não te vemos por aqui. Que tal uma visita especial? Apresente esta mensagem e ganhe 15% de desconto na sua próxima refeição. Válido até {{validade}}.',
      variables: ['nome', 'validade'],
    },
  ]

  for (const t of templates) {
    await prisma.messageTemplate.upsert({
      where: { id: t.id },
      update: {},
      create: { ...t, unitId: unitA.id },
    })
  }

  // ─── Automation Rules ─────────────────────────────────────────────────────
  const rules = [
    {
      id: 'auto-001',
      name: 'Confirmação automática de reserva',
      description: 'Envia mensagem de confirmação via WhatsApp sempre que uma reserva for confirmada',
      active: true,
      triggerEvent: 'reservation.confirmed',
      conditions: null,
      actions: [
        { type: 'SEND_MESSAGE', templateId: 'tmpl-001', channel: 'whatsapp' },
      ],
      executionCount: 47,
      lastExecutedAt: daysAgoAt(0, 19, 30),
    },
    {
      id: 'auto-002',
      name: 'Lembrete 24h antes da reserva',
      description: 'Envia lembrete automático 24h antes do horário da reserva confirmada',
      active: true,
      triggerEvent: 'reservation.reminder_24h',
      conditions: [{ field: 'status', operator: 'eq', value: 'CONFIRMED' }],
      actions: [
        { type: 'SEND_MESSAGE', templateId: 'tmpl-002', channel: 'whatsapp' },
      ],
      executionCount: 38,
      lastExecutedAt: daysAgoAt(1, 10, 0),
    },
    {
      id: 'auto-003',
      name: 'Boas-vindas ao novo cliente',
      description: 'Envia mensagem de boas-vindas quando um novo cliente realiza sua primeira visita',
      active: true,
      triggerEvent: 'customer.first_visit',
      conditions: [{ field: 'visitCount', operator: 'eq', value: 1 }],
      actions: [
        { type: 'SEND_MESSAGE', templateId: 'tmpl-003', channel: 'whatsapp' },
        { type: 'ADD_TAG', tag: 'novo' },
      ],
      executionCount: 12,
      lastExecutedAt: daysAgoAt(3, 14, 0),
    },
    {
      id: 'auto-004',
      name: 'Alerta de fila longa',
      description: 'Notifica a equipe quando a fila de espera atingir 5 ou mais pessoas',
      active: true,
      triggerEvent: 'queue.entry_added',
      conditions: [{ field: 'position', operator: 'gte', value: 5 }],
      actions: [
        { type: 'NOTIFY_STAFF', message: '⚠️ Fila com {{position}} pessoas. Considere abrir mais mesas.' },
      ],
      executionCount: 8,
      lastExecutedAt: todayAt(19, 0),
    },
    {
      id: 'auto-005',
      name: 'Prioridade VIP na fila',
      description: 'Notifica o host quando um cliente VIP entra na fila de espera',
      active: true,
      triggerEvent: 'queue.entry_added',
      conditions: [{ field: 'customer.segment', operator: 'eq', value: 'VIP' }],
      actions: [
        { type: 'NOTIFY_STAFF', message: '⭐ Cliente VIP {{guestName}} entrou na fila. Priorizar atendimento.' },
        { type: 'ADD_TAG', tag: 'vip-na-fila' },
      ],
      executionCount: 5,
      lastExecutedAt: daysAgoAt(2, 20, 15),
    },
    {
      id: 'auto-006',
      name: 'Pesquisa de satisfação pós-visita',
      description: 'Envia pesquisa de avaliação 2h após o check-out do cliente',
      active: false,
      triggerEvent: 'reservation.completed',
      conditions: null,
      actions: [
        { type: 'SEND_MESSAGE', templateId: 'tmpl-005', channel: 'whatsapp' },
      ],
      executionCount: 0,
      lastExecutedAt: null,
    },
  ]

  for (const rule of rules) {
    await prisma.automationRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        ...rule,
        conditions: rule.conditions as any,
        actions: rule.actions as any,
        unitId: unitA.id,
      },
    })
  }

  // Automation logs for executed rules
  const autoLogs = [
    { id: 'alog-001', ruleId: 'auto-001', entityType: 'reservation', entityId: 'res-001', status: 'success', result: { messageSent: true, phone: '(11) 98765-4321' }, executedAt: daysAgoAt(1, 9, 1) },
    { id: 'alog-002', ruleId: 'auto-001', entityType: 'reservation', entityId: 'res-009', status: 'success', result: { messageSent: true, phone: '(11) 84321-0987' }, executedAt: daysAgoAt(0, 10, 5) },
    { id: 'alog-003', ruleId: 'auto-002', entityType: 'reservation', entityId: 'res-015', status: 'success', result: { messageSent: true, phone: '(11) 99123-4567' }, executedAt: daysAgoAt(2, 10, 0) },
    { id: 'alog-004', ruleId: 'auto-003', entityType: 'customer', entityId: 'cust-005', status: 'success', result: { messageSent: true, tagAdded: 'novo' }, executedAt: daysAgoAt(3, 14, 2) },
    { id: 'alog-005', ruleId: 'auto-004', entityType: 'queue_entry', entityId: 'queue-005', status: 'success', result: { notificationSent: true, staffNotified: 'user-003' }, executedAt: todayAt(19, 1) },
    { id: 'alog-006', ruleId: 'auto-001', entityType: 'reservation', entityId: 'res-020', status: 'error', error: 'Número de telefone inválido — falha no envio WhatsApp', executedAt: daysAgoAt(11, 9, 3) },
  ]

  for (const log of autoLogs) {
    await prisma.automationLog.upsert({
      where: { id: log.id },
      update: {},
      create: {
        ...log,
        result: log.result as any ?? null,
        error: log.error ?? null,
      },
    })
  }

  // ─── Integration ──────────────────────────────────────────────────────────
  await prisma.integration.upsert({
    where: { unitId_type: { unitId: unitA.id, type: 'whatsapp' } },
    update: {},
    create: {
      id: 'integ-001',
      unitId: unitA.id,
      type: 'whatsapp',
      name: 'WhatsApp Business — Matriz',
      config: {
        phoneNumberId: '123456789012345',
        businessAccountId: '987654321098765',
        accessToken: 'EAABxxxx...xxxxx',
        webhookVerifyToken: 'tonysfood_webhook_2024',
        phoneNumber: '+55 (11) 3333-4000',
      },
      active: false,
    },
  })

  // ─── Webhooks ─────────────────────────────────────────────────────────────
  const webhook = await prisma.webhook.upsert({
    where: { id: 'wh-001' },
    update: {},
    create: {
      id: 'wh-001',
      unitId: unitA.id,
      name: 'ERP Integração — Reservas',
      url: 'https://erp.tonysfood.com.br/api/webhooks/reservations',
      secret: 'whsec_tonysfood_erp_2024',
      events: ['reservation.created', 'reservation.confirmed', 'reservation.cancelled', 'reservation.completed'],
      active: true,
      successCount: 142,
      failureCount: 3,
      lastCalledAt: daysAgoAt(0, 20, 5),
    },
  })

  const webhookLogs = [
    { id: 'whl-001', webhookId: webhook.id, eventType: 'reservation.confirmed', statusCode: 200, durationMs: 234, success: true, createdAt: daysAgoAt(0, 20, 5) },
    { id: 'whl-002', webhookId: webhook.id, eventType: 'reservation.confirmed', statusCode: 200, durationMs: 198, success: true, createdAt: daysAgoAt(0, 10, 10) },
    { id: 'whl-003', webhookId: webhook.id, eventType: 'reservation.cancelled', statusCode: 200, durationMs: 312, success: true, createdAt: daysAgoAt(5, 18, 1) },
    { id: 'whl-004', webhookId: webhook.id, eventType: 'reservation.created', statusCode: 502, durationMs: 10001, success: false, response: 'Bad Gateway — servidor ERP indisponível', createdAt: daysAgoAt(7, 9, 15) },
  ]

  for (const wl of webhookLogs) {
    await prisma.webhookLog.upsert({
      where: { id: wl.id },
      update: {},
      create: { ...wl, payload: { unitId: unitA.id }, response: (wl as any).response ?? null },
    })
  }

  // ─── System Events ────────────────────────────────────────────────────────
  await prisma.systemEvent.createMany({
    data: [
      { unitId: unitA.id, eventType: 'reservation.confirmed', entityType: 'reservation', entityId: 'res-001', payload: { guestName: 'Maria Silva', partySize: 4 }, occurredAt: daysAgoAt(1, 9) },
      { unitId: unitA.id, eventType: 'reservation.confirmed', entityType: 'reservation', entityId: 'res-009', payload: { guestName: 'Gabriel Araújo', partySize: 18 }, occurredAt: todayAt(10, 5) },
      { unitId: unitA.id, eventType: 'reservation.checked_in', entityType: 'reservation', entityId: 'res-005', payload: { guestName: 'Juliana Rocha' }, occurredAt: todayAt(19, 55) },
      { unitId: unitA.id, eventType: 'reservation.no_show', entityType: 'reservation', entityId: 'res-016', payload: { guestName: 'Marcos Alves', partySize: 5 }, occurredAt: daysAgoAt(2, 21, 0) },
      { unitId: unitA.id, eventType: 'queue.entry_added', entityType: 'queue_entry', entityId: 'queue-001', payload: { guestName: 'Camila Torres', position: 1, partySize: 3 }, occurredAt: todayAt(18, 30) },
      { unitId: unitA.id, eventType: 'queue.entry_added', entityType: 'queue_entry', entityId: 'queue-005', payload: { guestName: 'Paulo Mendes', position: 5, partySize: 6 }, occurredAt: todayAt(19, 0) },
      { unitId: unitA.id, eventType: 'queue.seated', entityType: 'queue_entry', entityId: 'queue-007', payload: { guestName: 'Marcus Silva', waitMinutes: 22 }, occurredAt: todayAt(19, 10) },
      { unitId: unitA.id, eventType: 'queue.abandoned', entityType: 'queue_entry', entityId: 'queue-010', payload: { guestName: 'Vanessa Pinto', reason: 'Tempo de espera longo' }, occurredAt: todayAt(18, 0) },
      { unitId: unitA.id, eventType: 'conversation.opened', entityType: 'conversation', entityId: 'conv-001', payload: { guestPhone: '(11) 98765-4321' }, occurredAt: todayAt(9, 30) },
      { unitId: unitA.id, eventType: 'customer.first_visit', entityType: 'customer', entityId: 'cust-005', payload: { customerName: 'Fernanda Costa', source: 'instagram' }, occurredAt: daysAgoAt(3, 14, 0) },
    ],
    skipDuplicates: true,
  })

  console.log('✅ Seed completo!')
  console.log(`   Units: 2 (Matriz Centro + Jardins)`)
  console.log(`   Users: 7 (todos os papéis)`)
  console.log(`   Customers: ${customersData.length}`)
  console.log(`   Catalog items: ${catalogItems.length}`)
  console.log(`   Reservations: ${reservations.length} (hoje, futuras e passadas)`)
  console.log(`   Queue entries: ${queueEntries.length} (aguardando, chamado, sentado, abandonado)`)
  console.log(`   Conversations: ${convDefs.length} com threads completas`)
  console.log(`   Message templates: ${templates.length}`)
  console.log(`   Automation rules: ${rules.length} (5 ativas, 1 inativa)`)
  console.log(`   Webhooks: 1 com logs`)
  console.log('')
  console.log('   Credenciais (senha: 123456):')
  console.log('   admin@tonysfood.local          → ADMIN')
  console.log('   gerente@tonysfood.local        → MANAGER')
  console.log('   recepcionista@tonysfood.local  → HOST')
  console.log('   atendimento@tonysfood.local    → ATTENDANT')
  console.log('   marketing@tonysfood.local      → MARKETING')
  console.log('   auditor@tonysfood.local        → AUDITOR')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
