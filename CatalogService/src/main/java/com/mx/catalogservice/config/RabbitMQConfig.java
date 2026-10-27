package com.mx.catalogservice.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    public static final String EXCHANGE_NAME = "ecommerce.events.exchange";
    public static final String QUEUE_STOCK_DISCOUNT = "catalog.stock.discount.queue";
    public static final String QUEUE_STOCK_RESTORE = "catalog.stock.restore.queue";
    public static final String ROUTING_KEY_ORDER_CREATED = "order.created";
    public static final String ROUTING_KEY_ORDER_CANCELLED = "order.cancelled";

    @Bean
    public TopicExchange exchange() {
        return new TopicExchange(EXCHANGE_NAME);
    }

    // 1. Cola para descontar stock
    @Bean
    public Queue stockDiscountQueue() {
        return new Queue(QUEUE_STOCK_DISCOUNT, true); // true = durable
    }

    // 2. Cola para devolver stock
    @Bean
    public Queue stockRestoreQueue() {
        return new Queue(QUEUE_STOCK_RESTORE, true);
    }

    // 3. Vinculacion (Binding): Cuando llegue "order.created" -> mandar a cola de descuento
    @Bean
    public Binding bindingDiscount(Queue stockDiscountQueue, TopicExchange exchange) {
        return BindingBuilder.bind(stockDiscountQueue).to(exchange).with(ROUTING_KEY_ORDER_CREATED);
    }
    // 4. Vinculacion (Binding): Cuando llegue "order.cancelled" -> mandar a cola de reintegro
    @Bean
    public Binding bindingRestore(Queue stockRestoreQueue, TopicExchange exchange) {
        return BindingBuilder.bind(stockRestoreQueue).to(exchange).with(ROUTING_KEY_ORDER_CANCELLED);
    }
    // 5. Convertidor para deserializar el JSON que llega
    @Bean
    public MessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }


}
