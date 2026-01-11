interface TemplateVariables {
  name?: string
  phone?: string
  order_id?: string
  thread_id?: string
  [key: string]: string | undefined
}

export function renderTemplate(
  template: string,
  variables: TemplateVariables
): string {
  let rendered = template

  // Replace variables in format {variable_name}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`\\{${key}\\}`, 'g')
    rendered = rendered.replace(regex, value || '')
  })

  // Remove any remaining unmatched variables
  rendered = rendered.replace(/\{[^}]+\}/g, '')

  return rendered.trim()
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{([^}]+)\}/g) || []
  return matches.map((match) => match.slice(1, -1))
}

