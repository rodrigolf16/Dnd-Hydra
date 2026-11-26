export function createActionCard({
  icon = '✦',
  typeLabel,
  title,
  description,
  meta,
  featured = false,
  exhausted = false,
  dualIcon = false,
  onClick,
  onDelete = null,
  tooltip = ''
}) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = `action-card${featured ? ' featured' : ''}${exhausted ? ' exhausted' : ''}`;
  if (tooltip) card.title = tooltip;
  card.innerHTML = `<span class="action-icon${dualIcon ? ' dual' : ''}"></span><span class="action-type"></span><b></b><small></small><span class="action-meta"><span></span><i>↗</i></span>`;
  card.querySelector('.action-icon').textContent = icon;
  card.querySelector('.action-type').textContent = typeLabel;
  card.querySelector('b').textContent = title;
  card.querySelector('small').textContent = description;
  card.querySelector('.action-meta span').textContent = meta;
  card.addEventListener('click', onClick);
  if (onDelete) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'card-delete-btn';
    del.textContent = '×';
    del.title = 'Eliminar acción personalizada';
    del.addEventListener('click', e => {
      e.stopPropagation();
      onDelete();
    });
    card.append(del);
  }
  return card;
}
