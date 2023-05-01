import { ComponentType, ModalOptions, TextInputStyle } from 'slash-create';

export function editModalStructure(prefill: { prize: string; winners: string; description: string }): ModalOptions {
  return {
    title: 'Edit Giveaway',
    components: [
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            type: ComponentType.TEXT_INPUT,
            label: 'Prize',
            custom_id: 'prize',
            placeholder: 'Type something...',
            style: TextInputStyle.SHORT,
            value: prefill.prize,
            min_length: 1,
            max_length: 100
          }
        ]
      },
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            type: ComponentType.TEXT_INPUT,
            label: 'Winners',
            custom_id: 'winners',
            placeholder: 'Type something...',
            style: TextInputStyle.SHORT,
            value: prefill.winners,
            min_length: 1,
            max_length: 10
          }
        ]
      },
      {
        type: ComponentType.ACTION_ROW,
        components: [
          {
            type: ComponentType.TEXT_INPUT,
            label: 'Description',
            custom_id: 'description',
            placeholder: 'Type something...',
            required: false,
            style: TextInputStyle.PARAGRAPH,
            value: prefill.description,
            min_length: 1,
            max_length: 1000
          }
        ]
      }
    ]
  };
}
