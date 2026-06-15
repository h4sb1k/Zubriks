#!/usr/bin/env node

const fs = require('fs');

// Husky передает путь к файлу с сообщением коммита как первый аргумент
const commitMsgFile = process.argv[2];

if (!commitMsgFile) {
  console.error('❌ Ошибка: Файл сообщения коммита не передан.');
  process.exit(1);
}

try {
  // 1. Читаем сообщение коммита
  let commitMsg = fs.readFileSync(commitMsgFile, 'utf8');
  
  // Разделяем на строки, чтобы модифицировать ТОЛЬКО заголовок (первую строку)
  // Это best practice, чтобы не повредить тело коммита (commit body)
  const lines = commitMsg.split('\n');
  let subject = lines[0];

  // 2. Trimmed by spaces (удаляем пробелы по краям)
  subject = subject.trim();

  // 3. All dots will be removed from the end of string (удаляем все точки в конце)
  subject = subject.replace(/\.+$/, '');

  // 4. First letter will be uppercased
  // Best Practice: Учитываем Conventional Commits (например, "feat: ", "fix(scope): ")
  // Если префикс есть, делаем заглавной первую букву ПОСЛЕ префикса.
  // Если нет, делаем заглавной самую первую букву.
  const conventionalPrefixMatch = subject.match(/^(\w+(?:\([^)]+\))?!?:\s*)(.*)$/);
  
  if (conventionalPrefixMatch) {
    const prefix = conventionalPrefixMatch[1];
    const rest = conventionalPrefixMatch[2];
    
    if (rest.length > 0) {
      subject = prefix + rest.charAt(0).toUpperCase() + rest.slice(1);
    } else {
      // Если после префикса ничего нет (редкий случай), делаем заглавной букву префикса
      subject = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }
  } else {
    // Обычное поведение, если префикса Conventional Commits нет
    if (subject.length > 0) {
      subject = subject.charAt(0).toUpperCase() + subject.slice(1);
    }
  }

  // Собираем сообщение обратно
  lines[0] = subject;

  // 5. Записываем измененное сообщение обратно в файл
  fs.writeFileSync(commitMsgFile, lines.join('\n'), 'utf8');

  process.exit(0);
} catch (error) {
  console.error('❌ Ошибка при обработке сообщения коммита:', error);
  process.exit(1);
}